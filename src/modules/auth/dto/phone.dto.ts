import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsPhoneForCountry } from '../../../common/decorators/is-phone-for-country.decorator.js';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

export class PhoneDto {
  @ApiProperty({ example: '91', description: 'Numeric country calling code' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @IsNumberString(
    { no_symbols: true },
    {
      message: i18nValidationMessage<I18nTranslations>(
        'validation.IS_NUMBER_STRING',
      ),
    },
  )
  countryCode: string;

  @ApiProperty({
    example: '9876543210',
    description: 'National phone number for the given country code',
  })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @IsNumberString(
    { no_symbols: true },
    {
      message: i18nValidationMessage<I18nTranslations>(
        'validation.IS_NUMBER_STRING',
      ),
    },
  )
  @IsPhoneForCountry({
    message: i18nValidationMessage<I18nTranslations>(
      'validation.IS_PHONE_FOR_COUNTRY',
    ),
  })
  phoneNumber: string;
}

export class RegisterPhoneDto extends PhoneDto {}

export class LoginPhoneDto extends PhoneDto {}

export class VerifyPhoneDto extends PhoneDto {
  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  @IsNumberString(
    { no_symbols: true },
    {
      message: i18nValidationMessage<I18nTranslations>(
        'validation.IS_NUMBER_STRING',
      ),
    },
  )
  @Matches(/^\d{6}$/, {
    message: i18nValidationMessage<I18nTranslations>('validation.MATCHES'),
  })
  otp: string;
}
