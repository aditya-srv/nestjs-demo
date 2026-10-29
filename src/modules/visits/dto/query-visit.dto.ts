import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import { VisitStatus } from '../../../generated/prisma/client.js';

export class QueryVisitDto {
  @IsOptional()
  @IsEnum(VisitStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  status?: VisitStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  patientId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  @Min(1, {
    message: i18nValidationMessage<I18nTranslations>('validation.MIN'),
  })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  @Min(1, {
    message: i18nValidationMessage<I18nTranslations>('validation.MIN'),
  })
  @Max(100, {
    message: i18nValidationMessage<I18nTranslations>('validation.MAX'),
  })
  pageSize?: number;
}
