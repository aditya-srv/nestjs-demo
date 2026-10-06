import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import { AppointmentType } from '../../../generated/prisma/client.js';

function toOptionalInt({ value }: { value: unknown }): unknown {
  if (value === null || value === undefined || value === '') {
    return value === '' ? undefined : value;
  }
  return Number(value);
}

export class CreateAppointmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  patientId?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  doctorId?: number | null;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  appointmentAt: string;

  @IsEnum(AppointmentType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type: AppointmentType;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  reason?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  notes?: string;
}
