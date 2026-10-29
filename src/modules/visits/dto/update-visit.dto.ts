import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import { VisitStatus, VisitType } from '../../../generated/prisma/client.js';

export class UpdateVisitDto {
  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  visitedAt?: string;

  @IsOptional()
  @IsEnum(VisitType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type?: VisitType;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  reason?: string;

  @IsOptional()
  @IsEnum(VisitStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  status?: VisitStatus;
}
