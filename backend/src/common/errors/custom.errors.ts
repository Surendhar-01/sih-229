import { HttpException, HttpStatus } from '@nestjs/common';

export class AppUnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized access') {
    super({ success: false, message, errors: ['Invalid or missing authentication token'] }, HttpStatus.UNAUTHORIZED);
  }
}

export class AppForbiddenException extends HttpException {
  constructor(message = 'Access forbidden: Insufficient permissions for this role') {
    super({ success: false, message, errors: ['Role does not have permission for this resource'] }, HttpStatus.FORBIDDEN);
  }
}

export class AppNotFoundException extends HttpException {
  constructor(resource = 'Resource', id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super({ success: false, message, errors: [message] }, HttpStatus.NOT_FOUND);
  }
}

export class AppValidationException extends HttpException {
  constructor(errors: string[]) {
    super({ success: false, message: 'Validation failed', errors }, HttpStatus.BAD_REQUEST);
  }
}

export class AppConflictException extends HttpException {
  constructor(message = 'Resource conflict detected') {
    super({ success: false, message, errors: [message] }, HttpStatus.CONFLICT);
  }
}

export class ExternalAiServiceException extends HttpException {
  constructor(detail = 'AI Microservice is currently unavailable or returned an error') {
    super({ success: false, message: 'External AI Service Error', errors: [detail] }, HttpStatus.BAD_GATEWAY);
  }
}

export class SupabaseDatabaseException extends HttpException {
  constructor(detail = 'Database query failed') {
    super({ success: false, message: 'Database Error', errors: [detail] }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
