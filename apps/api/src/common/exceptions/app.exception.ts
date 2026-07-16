import { HttpException, HttpStatus } from "@nestjs/common";

export interface AppExceptionDetail {
  field?: string;
  message: string;
}

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details: AppExceptionDetail[];

  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details: AppExceptionDetail[] = [],
  ) {
    super(message, status);
    this.code = code;
    this.details = details;
  }
}
