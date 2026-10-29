import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

export enum AllergyType {
  FOOD = 'FOOD',
  DRUG = 'DRUG',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
}

export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export class AllergyItemDto {
  @ApiProperty({ example: 'Penicillin' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  name: string;

  @ApiProperty({ enum: AllergyType, example: AllergyType.DRUG })
  @IsEnum(AllergyType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type: AllergyType;

  @ApiProperty({ enum: AllergySeverity, example: AllergySeverity.SEVERE })
  @IsEnum(AllergySeverity, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  severity: AllergySeverity;

  @ApiProperty({ example: 'Anaphylaxis' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  reaction: string;
}

export class SaveAllergiesDto {
  @ApiProperty({ type: [AllergyItemDto] })
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => AllergyItemDto)
  allergies: AllergyItemDto[];
}
