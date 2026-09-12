import { IsNotEmpty, IsNumberString, IsString, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsPhoneForCountry } from '../../../common/decorators/is-phone-for-country.decorator.js';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';

export class PhoneDto {
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
