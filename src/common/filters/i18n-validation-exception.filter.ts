import { HttpStatus, ValidationError } from '@nestjs/common';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';

function groupValidationErrors(
  errors: ValidationError[],
  parent = '',
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;

    if (error.constraints) {
      grouped[path] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(grouped, groupValidationErrors(error.children, path));
    }
  }

  return grouped;
}

export const i18nValidationExceptionFilter = new I18nValidationExceptionFilter({
  errorFormatter: (errors) => groupValidationErrors(errors),
  responseBodyFormatter: (_host, _exc, formattedErrors) => ({
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: formattedErrors,
  }),
});
