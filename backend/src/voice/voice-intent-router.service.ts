import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../config/supabase.service';

export interface VoiceRouteRequestDto {
  transcript: string;
  language?: 'en' | 'hi' | 'mr';
  current_route?: string;
  context_data?: Record<string, any>;
}

export interface VoiceRouteResponseDto {
  transcript: string;
  language_detected: string;
  intent: string;
  action: string | null;
  target_route: string | null;
  entities: Record<string, any>;
  confidence: number;
  spoken_response: {
    en: string;
    hi: string;
    mr: string;
  };
  allowed: boolean;
  security_reason?: string;
  requires_confirmation: boolean;
  status: 'SUCCESS' | 'DENIED' | 'FALLBACK';
}

@Injectable()
export class VoiceIntentRouterService {
  private readonly logger = new Logger(VoiceIntentRouterService.name);
  private readonly aiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.aiUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  /**
   * Centralized voice command routing, natural language intent mapping,
   * context-aware navigation, and strict role-based authorization check.
   */
  async routeVoiceCommand(
    dto: VoiceRouteRequestDto,
    authenticatedUser?: any,
  ): Promise<VoiceRouteResponseDto> {
    const userRole = authenticatedUser?.role || 'GUEST';
    const accountStatus = authenticatedUser?.account_status || 'UNKNOWN';
    const lang = dto.language || 'en';

    let nlpResult: any;

    try {
      const response = await axios.post(
        `${this.aiUrl}/voice-command-nlp`,
        {
          transcript: dto.transcript,
          language: lang,
          current_route: dto.current_route || '/',
          user_role: userRole,
          context_data: dto.context_data || {},
        },
        { timeout: 5000 },
      );
      nlpResult = response.data;
    } catch (err: any) {
      this.logger.warn(`FastAPI NLP service unavailable, using local semantic fallback: ${err.message}`);
      nlpResult = this.localSemanticFallback(dto.transcript, lang, userRole, dto.current_route);
    }

    // -------------------------------------------------------------
    // STRICT ROLE-BASED AUTHORIZATION ENFORCEMENT
    // A voice command must NEVER bypass authentication, permissions,
    // or account verification status.
    // -------------------------------------------------------------
    const authorization = this.validateRoleAuthorization(
      nlpResult.intent,
      nlpResult.action,
      nlpResult.target_route,
      userRole,
      accountStatus,
    );

    if (!authorization.allowed) {
      this.logger.warn(
        `Voice command BLOCKED by RBAC: user=${authenticatedUser?.id || 'guest'} role=${userRole} action=${nlpResult.action} reason=${authorization.reason}`,
      );

      return {
        transcript: dto.transcript,
        language_detected: nlpResult.language_detected || lang,
        intent: nlpResult.intent,
        action: nlpResult.action,
        target_route: null,
        entities: nlpResult.entities || {},
        confidence: nlpResult.confidence || 0.85,
        spoken_response: {
          en: `Access denied. ${authorization.reason}`,
          hi: `अनुमति अस्वीकृत। इस कार्रवाई के लिए आपकी भूमिका अधिकृत नहीं है।`,
          mr: `परवानगी नाकारली. या कृतीसाठी आपली भूमिका अधिकृत नाही.`,
        },
        allowed: false,
        security_reason: authorization.reason,
        requires_confirmation: false,
        status: 'DENIED',
      };
    }

    return {
      transcript: dto.transcript,
      language_detected: nlpResult.language_detected || lang,
      intent: nlpResult.intent,
      action: nlpResult.action,
      target_route: nlpResult.target_route,
      entities: nlpResult.entities || {},
      confidence: nlpResult.confidence || 0.92,
      spoken_response: nlpResult.spoken_response,
      allowed: true,
      requires_confirmation: Boolean(nlpResult.requires_confirmation),
      status: 'SUCCESS',
    };
  }

  /**
   * Validate whether user's role and account status permit the requested action or target route.
   */
  private validateRoleAuthorization(
    intent: string,
    action: string | null,
    targetRoute: string | null,
    userRole: string,
    accountStatus: string,
  ): { allowed: boolean; reason?: string } {
    // Public routes accessible without login
    const publicRoutes = ['/', '/login', '/register', '/field-app', '/datasets', '/admin/datasets'];
    if (targetRoute && publicRoutes.includes(targetRoute)) {
      return { allowed: true };
    }

    // Auth actions always allowed
    if (intent === 'AUTH_NAVIGATION' || action === 'NAVIGATE_LOGIN' || action === 'SWITCH_AUTH_PHONE' || action === 'TRIGGER_GOOGLE_AUTH') {
      return { allowed: true };
    }

    // Informational queries (rates, help, explanations) are always public
    if (intent === 'QUERY_STATUS' || intent === 'QUERY_EXPLANATION' || intent === 'GENERAL_QUERY') {
      return { allowed: true };
    }

    // Role-specific protected route checks
    if (targetRoute) {
      if (targetRoute.startsWith('/admin')) {
        if (userRole !== 'GOVERNMENT_ADMIN') {
          return { allowed: false, reason: 'Government Administrative clearance required.' };
        }
      }

      if (targetRoute.startsWith('/recycler')) {
        if (userRole !== 'AUTHORIZED_RECYCLER' && userRole !== 'GOVERNMENT_ADMIN') {
          return { allowed: false, reason: 'Only authorized CPCB recyclers can access this section.' };
        }
      }

      if (targetRoute.startsWith('/collector')) {
        if (userRole !== 'COLLECTION_COLLECTOR' && userRole !== 'INFORMAL_AGGREGATOR' && userRole !== 'GOVERNMENT_ADMIN') {
          return { allowed: false, reason: 'Informal Collector or Aggregator credentials required.' };
        }
      }
    }

    // Suspended accounts cannot execute active mutating actions
    if (accountStatus === 'SUSPENDED' || accountStatus === 'REJECTED') {
      if (intent === 'ACTION_TRIGGER') {
        return { allowed: false, reason: `Account is ${accountStatus}. Administrative action blocked.` };
      }
    }

    return { allowed: true };
  }

  /**
   * High-accuracy resilient local semantic fallback in case AI service is rebooting.
   */
  private localSemanticFallback(
    transcript: string,
    lang: string,
    role: string,
    currentRoute?: string,
  ) {
    const lower = transcript.toLowerCase();

    if (lower.includes('login') || lower.includes('लॉगिन') || lower.includes('साइन')) {
      return {
        transcript,
        language_detected: lang,
        intent: 'NAVIGATE',
        action: 'NAVIGATE_LOGIN',
        target_route: '/login',
        spoken_response: {
          en: 'Opening platform sign in.',
          hi: 'लॉगिन खोला जा रहा है।',
          mr: 'लॉगिन उघडत आहोत.',
        },
      };
    }

    if (lower.includes('lot') || lower.includes('लॉट') || lower.includes('कचरा')) {
      return {
        transcript,
        language_detected: lang,
        intent: 'NAVIGATE',
        action: 'START_LOT_CREATION',
        target_route: '/collector/intake',
        spoken_response: {
          en: 'Opening lot creation intake window.',
          hi: 'लॉट निर्माण विंडो खोली जा रही है।',
          mr: 'लॉट नोंदणी सुरू करत आहोत.',
        },
      };
    }

    if (lower.includes('bhav') || lower.includes('price') || lower.includes('भाव') || lower.includes('दर')) {
      return {
        transcript,
        language_detected: lang,
        intent: 'QUERY_STATUS',
        action: 'SPOKEN_RATE_QUERY',
        spoken_response: {
          en: 'Current average rates: Circuit Boards ₹110 to ₹280 per kg, Copper ₹420 to ₹680 per kg.',
          hi: 'वर्तमान बाजार भाव: सर्किट बोर्ड ₹110 से ₹280 प्रति किलो, तांबा ₹420 से ₹680 प्रति किलो।',
          mr: 'सध्याचे बाजार दर: सर्किट बोर्ड ₹110 ते ₹280 प्रति किलो, तांबे ₹420 ते ₹680 प्रति किलो.',
        },
      };
    }

    const defaultRoute = role === 'AUTHORIZED_RECYCLER'
      ? '/recycler/dashboard'
      : role === 'GOVERNMENT_ADMIN'
        ? '/admin/dashboard'
        : '/collector/dashboard';

    return {
      transcript,
      language_detected: lang,
      intent: 'NAVIGATE',
      action: 'OPEN_DASHBOARD',
      target_route: defaultRoute,
      spoken_response: {
        en: 'Navigating to your dashboard.',
        hi: 'डैशबोर्ड पर ले जाया जा रहा है।',
        mr: 'डॅशबोर्डवर नेत आहोत.',
      },
    };
  }
}
