import { Transform } from 'class-transformer';
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
import {
  AppointmentStatus,
  AppointmentType,
} from '../../../generated/prisma/client.js';

function toOptionalInt({ value }: { value: unknown }): unknown {
  if (value === null || value === undefined || value === '') {
    return value === '' ? undefined : value;
  }
  return Number(value);
}

export class UpdateAppointmentDto {
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  doctorId?: number | null;

  @IsOptional()
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
  appointmentAt?: string;

  @IsOptional()
  @IsEnum(AppointmentType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type?: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  status?: AppointmentStatus;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  reason?: string | null;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  notes?: string | null;
}
