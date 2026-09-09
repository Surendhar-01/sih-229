import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body['message'] || message;
        if (Array.isArray(body['message'])) {
          errors = body['message'];
          message = 'Validation error';
        } else if (body['errors']) {
          errors = body['errors'];
        }
      }
    } else {
      this.logger.error('Unhandled Exception:', exception);
      message = 'An unexpected server error occurred. Internal details hidden for security.';
    }

    response.status(status).json({
      success: false,
      message,
      errors: errors.length > 0 ? errors : [message],
    });
  }
}
