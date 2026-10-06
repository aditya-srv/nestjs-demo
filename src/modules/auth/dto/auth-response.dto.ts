import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
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

export class OtpRequestedDto {
  countryCode: string;
  phoneNumber: string;
  resendAvailableInSeconds: number;
}

export class AuthDto {
  accessToken: string;
  user: AuthUserResponseDto;
}

export class OtpRequestedResponseDto extends DataResponseDto<OtpRequestedDto> {
  declare data: OtpRequestedDto;
}

export class AuthResponseDto extends DataResponseDto<AuthDto> {
  declare data: AuthDto;
}
