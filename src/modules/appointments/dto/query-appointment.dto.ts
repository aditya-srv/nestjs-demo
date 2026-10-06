import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import { AppointmentStatus } from '../../../generated/prisma/client.js';

export class QueryAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  status?: AppointmentStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return value;
  })
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_BOOLEAN'),
  })
  upcoming?: boolean;

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
