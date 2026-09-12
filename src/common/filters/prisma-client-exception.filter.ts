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
    const body = httpException?.getResponse() ?? {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.i18n.t('errors.internal'),
    };

    httpAdapter.reply(host.switchToHttp().getResponse(), body, status);
  }

  private toHttpException(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException(this.i18n.t('errors.conflict'));
      case 'P2025':
        return new NotFoundException(this.i18n.t('errors.notFound'));
      case 'P2003':
        return new BadRequestException(this.i18n.t('errors.relatedNotFound'));
      default:
        return null;
    }
  }
}
