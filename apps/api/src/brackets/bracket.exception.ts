import { HttpException, HttpStatus } from "@nestjs/common";

export class BracketHttpException extends HttpException {
  constructor(status: number, message: string, errors?: unknown) {
    super(
      {
        success: false,
        message,
        errors
      },
      status ?? HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
