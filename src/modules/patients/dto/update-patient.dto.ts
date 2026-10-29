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
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  fullName?: string;

  @ApiPropertyOptional({ example: 'priya@example.com' })
  @IsOptional()
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_EMAIL'),
    },
  )
  email?: string;

  @ApiPropertyOptional({ example: 'en', enum: ['en'] })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsIn(['en'], {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_IN'),
  })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'ISO date YYYY-MM-DD',
  })
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

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/photos/priya.jpg',
  })
  @IsOptional()
  @IsUrl(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_URL'),
    },
  )
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ example: 'O+', enum: BLOOD_GROUPS })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsIn(BLOOD_GROUPS, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_IN'),
  })
  bloodGroup?: string;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}
