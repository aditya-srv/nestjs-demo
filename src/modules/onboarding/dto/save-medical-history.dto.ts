import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

const CURRENT_YEAR = new Date().getFullYear();

export class SurgeryDto {
  @ApiProperty({ example: 'Appendectomy' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  name: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  @Min(1900, {
    message: i18nValidationMessage<I18nTranslations>('validation.MIN'),
  })
  @Max(CURRENT_YEAR, {
    message: i18nValidationMessage<I18nTranslations>('validation.MAX'),
  })
  year?: number;
}

export class SaveMedicalHistoryDto {
  @ApiProperty({
    type: [String],
    example: ['Hypertension', 'Type 2 Diabetes'],
  })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @IsString({
    each: true,
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  chronicConditions: string[];

  @ApiProperty({ type: [SurgeryDto] })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => SurgeryDto)
  surgeries: SurgeryDto[];
}
