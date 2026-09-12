import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '../../generated/prisma/client.js';
import type { I18nTranslations } from '../../generated/i18n.generated.js';
import {
  i18nException,
  translateHttpException,
  translateKey,
} from '../utils/i18n-exception.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const { httpAdapter } = this.httpAdapterHost;
    const httpException = this.toHttpException(exception);
    const status =
      httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const body = httpException
      ? translateHttpException(httpException, host, this.i18n)
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: translateKey('errors.internal', host, this.i18n),
        };

    httpAdapter.reply(host.switchToHttp().getResponse(), body, status);
  }

  private toHttpException(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException(i18nException('errors.conflict'));
      case 'P2025':
        return new NotFoundException(i18nException('errors.notFound'));
      case 'P2003':
        return new BadRequestException(i18nException('errors.relatedNotFound'));
      default:
        return null;
    }
  }
}
