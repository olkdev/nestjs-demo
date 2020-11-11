import { Response } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

enum FilteredMessage {
  InternalServerError = 'Internal server error, please contact the developer',
  AuthorizationError = 'Authorization error, please provide a valid token',
  ValidationError = 'Validation error, please check the request parameters',
  APINotFoundError = 'API not found error, please send the correct request',
}

interface UnfilteredBody {
  statusCode?: HttpStatus;
  message: string | string[];
}

interface FilteredBody {
  code: number;
  message: string;
  data: null | string[];
}

@Catch()
export class BaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const filteredBody: FilteredBody = {
      code: -1,
      message: FilteredMessage.InternalServerError,
      data: null,
    };

    if (exception instanceof HttpException) {
      const { statusCode, message } = exception.getResponse() as UnfilteredBody;

      switch (statusCode) {
        case HttpStatus.NOT_FOUND:
          filteredBody.message = FilteredMessage.APINotFoundError;
          break;
        case HttpStatus.UNAUTHORIZED:
          filteredBody.message = FilteredMessage.AuthorizationError;
          break;
        case HttpStatus.BAD_REQUEST:
          if (Array.isArray(message)) {
            filteredBody.code = 10000;
            filteredBody.message = FilteredMessage.ValidationError;
            filteredBody.data = message;
          } else {
            filteredBody.message = message;
          }
          break;
        default:
          filteredBody.message = message as string;
          break;
      }
    }

    if (!(exception instanceof NotFoundException)) {
      // eslint-disable-next-line no-console -- intentionally print native error msg
      console.error('[BaseExceptionFilter]', exception);
    }
    response.status(status).json(filteredBody);
  }
}
