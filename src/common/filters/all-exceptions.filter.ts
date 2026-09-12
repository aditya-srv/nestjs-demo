import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import type { I18nTranslations } from '../../generated/i18n.generated.js';
import {
  translateHttpException,
  translateKey,
} from '../utils/i18n-exception.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException || status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const body =
      isHttpException && status < 500
        ? translateHttpException(exception, host, this.i18n)
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: translateKey('errors.internal', host, this.i18n),
          };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}
