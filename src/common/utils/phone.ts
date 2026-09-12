import libphonenumber from 'google-libphonenumber';

const DIGITS_ONLY = /^\d+$/;

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

export function isValidPhoneForCountry(
  countryCode: string,
  phoneNumber: string,
): boolean {
  if (!DIGITS_ONLY.test(countryCode) || !DIGITS_ONLY.test(phoneNumber)) {
    return false;
  }

  const callingCode = Number(countryCode);
  if (!Number.isInteger(callingCode) || callingCode <= 0) {
    return false;
  }

  const region = phoneUtil.getRegionCodeForCountryCode(callingCode);
  if (!region || region === 'ZZ') {
    return false;
  }

  try {
    const parsed = phoneUtil.parse(phoneNumber, region);
    return phoneUtil.isValidNumberForRegion(parsed, region);
  } catch {
    return false;
  }
}
