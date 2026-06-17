import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LoggingExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const payload = exception instanceof HttpException ? exception.getResponse() : "Internal server error";

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.url} failed with ${status}`, stack);
    } else {
      this.logger.warn(`${request.method} ${request.url} failed with ${status}`);
    }

    response.status(status).json({
      statusCode: status,
      message: this.extractMessage(payload, status),
      error: payload,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }

  private extractMessage(payload: unknown, status: number) {
    if (typeof payload === "string") {
      return payload;
    }

    if (payload && typeof payload === "object" && "message" in payload) {
      const value = (payload as { message?: unknown }).message;
      if (Array.isArray(value)) {
        return value.find((item): item is string => typeof item === "string") ?? this.defaultMessage(status);
      }
      if (typeof value === "string") {
        return value;
      }
    }

    return this.defaultMessage(status);
  }

  private defaultMessage(status: number) {
    return status >= 500 ? "Internal server error" : "Request failed";
  }
}
