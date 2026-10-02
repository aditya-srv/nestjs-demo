import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { I18nContext, type I18nService } from 'nestjs-i18n';
import type {
  I18nPath,
  I18nTranslations,
} from '../../generated/i18n.generated.js';

export type I18nExceptionArgs = Record<string, string | number>;

export type I18nExceptionPayload = {
  key: I18nPath;
  args?: I18nExceptionArgs;
};

export function i18nException(
  key: I18nPath,
  args?: I18nExceptionArgs,
): I18nExceptionPayload {
  return args === undefined ? { key } : { key, args };
}

export function translateKey(
  key: I18nPath,
  host: ArgumentsHost,
  i18n: I18nService<I18nTranslations>,
  args?: I18nExceptionArgs,
): string {
  const lang = I18nContext.current<I18nTranslations>(host)?.lang;
  return i18n.t(key, {
    ...(lang ? { lang } : {}),
    ...(args ? { args } : {}),
  });
}

export function translateHttpException(
  exception: HttpException,
  host: ArgumentsHost,
  i18n: I18nService<I18nTranslations>,
): Record<string, unknown> {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return {
      statusCode,
      message: response,
      error: httpErrorName(statusCode),
    };
  }

  if (isI18nExceptionPayload(response)) {
    return {
      statusCode,
      message: translateKey(response.key, host, i18n, response.args),
      error: httpErrorName(statusCode),
    };
  }

  if (response !== null && typeof response === 'object') {
    return response as Record<string, unknown>;
  }

  return {
    statusCode,
    message: translateKey('errors.internal', host, i18n),
    error: httpErrorName(statusCode),
  };
}

function isI18nExceptionPayload(value: object): value is I18nExceptionPayload {
  const record = value as Record<string, unknown>;
  return typeof record.key === 'string' && !('statusCode' in record);
}

function httpErrorName(status: number): string {
  const name = HttpStatus[status];
  if (typeof name !== 'string') {
    return 'Error';
  }

  return name
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
