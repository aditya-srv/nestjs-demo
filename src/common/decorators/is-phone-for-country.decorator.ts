import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { isValidPhoneForCountry } from '../utils/phone.js';

@ValidatorConstraint({ name: 'isPhoneForCountry', async: false })
export class IsPhoneForCountryConstraint
  implements ValidatorConstraintInterface
{
  validate(phoneNumber: unknown, args: ValidationArguments): boolean {
    const object = args.object as { countryCode?: unknown };

    if (
      typeof object.countryCode !== 'string' ||
      typeof phoneNumber !== 'string'
    ) {
      return false;
    }

    if (!/^\d+$/.test(object.countryCode)) {
      return true;
    }

    return isValidPhoneForCountry(object.countryCode, phoneNumber);
  }
}

export function IsPhoneForCountry(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneForCountryConstraint,
    });
  };
}
