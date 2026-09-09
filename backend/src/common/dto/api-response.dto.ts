export class ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any[];

  static success<T>(data: T, message = 'Operation successful', meta?: Record<string, any>): ApiResponseDto<T> {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(message = 'Operation failed', errors: any[] = []): ApiResponseDto<null> {
    return {
      success: false,
      message,
      errors,
    };
  }
}
