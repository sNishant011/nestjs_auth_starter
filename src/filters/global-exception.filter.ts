import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { capitalizeFirstLetter } from 'src/utils/string.utils';
import {
  QueryFailedError,
  EntityNotFoundError,
  CannotCreateEntityIdMapError,
} from 'typeorm';

// Credit: https://stackoverflow.com/a/67556738

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let message = (exception as any).message.message;
    let code = 'HttpException';

    Logger.error(
      message,
      (exception as any).stack,
      `${request.method} ${request.url}`,
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.constructor) {
      case BadRequestException:
        status = HttpStatus.BAD_REQUEST;
        message = (exception as any).response.message;
        break;
      case HttpException:
        status = (exception as HttpException).getStatus();
        message = (exception as HttpException).message;
        break;
      case UnauthorizedException:
        status = HttpStatus.UNAUTHORIZED;
        message = (exception as UnauthorizedException).message;
        break;
      case ForbiddenException:
        status = HttpStatus.FORBIDDEN;
        message = (exception as ForbiddenException).message;
        break;
      case QueryFailedError:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        code = (exception as any).code;
        if (code === 'ER_DUP_ENTRY') {
          const key = (exception as any)?.sqlMessage.split(' ')?.at(2);
          message = `${key} already taken`;
        } else if (code === 'ER_NO_REFERENCED_ROW_2') {
          message = 'It has a reference to a non-existent entity';
        } else if (code === 'ER_ROW_IS_REFERENCED_2') {
          message = 'It is referenced by another entity';
        } else if (code === 'ER_NO_DEFAULT_FOR_FIELD') {
          message = 'Field cannot be null';
        } else if (code === 'ER_BAD_NULL_ERROR') {
          message = 'Field cannot be null';
        } else if (code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
          message = 'Incorrect value';
        } else if (code === 'ER_DATA_TOO_LONG') {
          message = 'Data too long';
        } else if (code === 'ER_DUP_FIELDNAME') {
          message = 'Duplicate field name';
        } else if (code === 'ER_BAD_FIELD_ERROR') {
          message = 'Unknown column';
        } else {
          message = 'Unknown error';
        }
        break;
      case EntityNotFoundError:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as EntityNotFoundError).message;
        code = (exception as any).code;
        break;
      case CannotCreateEntityIdMapError:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as CannotCreateEntityIdMapError).message;
        code = (exception as any).code;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response
      .status(status)
      .json(
        GlobalResponseError(
          status,
          typeof message === 'string'
            ? capitalizeFirstLetter(message)
            : message,
          code,
          request,
        ),
      );
  }
}
export interface ResponseError {
  statusCode: number;
  message: string | string[];
  code: string;
  timestamp: string;
  path: string;
  method: string;
}
export const GlobalResponseError: (
  statusCode: number,
  message: string,
  code: string,
  request: Request,
) => ResponseError = (
  statusCode: number,
  message: string,
  code: string,
  request: Request,
): ResponseError => {
  return {
    statusCode: statusCode,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };
};
