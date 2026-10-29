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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Gender } from '../../../generated/prisma/client.js';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

export class SaveBasicDetailsDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  fullName: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'ISO date YYYY-MM-DD',
  })
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
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.FEMALE })
  @IsEnum(Gender, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  gender: Gender;

  @ApiProperty({ example: 'priya@example.com' })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_EMAIL'),
    },
  )
  email: string;

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

  @ApiPropertyOptional({ example: 'en', enum: ['en'] })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsIn(['en'], {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_IN'),
  })
  preferredLanguage?: string;
}
