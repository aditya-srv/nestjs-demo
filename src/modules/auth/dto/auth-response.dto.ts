import type { Role } from '../../../generated/prisma/client.js';

export class AuthUserResponseDto {
  id: number;
  countryCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  name: string | null;
  role: Role | null;
  preferredLanguage: string;
  onboardingCompleted: boolean;
}

export class OtpRequestedResponseDto {
  countryCode: string;
  phoneNumber: string;
  resendAvailableInSeconds: number;
}

export class AuthResponseDto {
  accessToken: string;
  user: AuthUserResponseDto;
}
