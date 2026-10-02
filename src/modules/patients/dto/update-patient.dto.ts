import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Gender } from '../../../generated/prisma/client.js';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import { EmergencyContactDto } from './emergency-contact.dto.js';

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export class UpdatePatientDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  fullName?: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_EMAIL'),
    },
  )
  email?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsIn(['en'], {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_IN'),
  })
  preferredLanguage?: string;

  @IsOptional()
  @Type(() => String)
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: i18nValidationMessage<I18nTranslations>('validation.MATCHES'),
  })
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  gender?: Gender;

  @IsOptional()
  @IsUrl(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_URL'),
    },
  )
  profilePhotoUrl?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsIn(BLOOD_GROUPS, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_IN'),
  })
  bloodGroup?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}
