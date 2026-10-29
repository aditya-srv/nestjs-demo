import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'Dr. Anita Mehta' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  fullName?: string;

  @ApiPropertyOptional({ example: 'anita@example.com' })
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

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @MaxLength(120, {
    message: i18nValidationMessage<I18nTranslations>('validation.MAX_LENGTH'),
  })
  specialization?: string;
}
