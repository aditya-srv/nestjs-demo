import { ApiProperty } from '@nestjs/swagger';
import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
import { Role } from '../../../generated/prisma/client.js';

export class AuthUserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '91', nullable: true })
  countryCode: string | null;

  @ApiProperty({ example: '9876543210', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: null, nullable: true })
  email: string | null;

  @ApiProperty({ example: null, nullable: true })
  name: string | null;

  @ApiProperty({ enum: Role, nullable: true, example: Role.PATIENT })
  role: Role | null;

  @ApiProperty({ example: 'en' })
  preferredLanguage: string;

  @ApiProperty({ example: false })
  onboardingCompleted: boolean;
}

export class OtpRequestedDto {
  @ApiProperty({ example: '91' })
  countryCode: string;

  @ApiProperty({ example: '9876543210' })
  phoneNumber: string;

  @ApiProperty({ example: 60 })
  resendAvailableInSeconds: number;
}

export class AuthDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}

export class OtpRequestedResponseDto extends DataResponseDto<OtpRequestedDto> {
  @ApiProperty({ type: OtpRequestedDto })
  declare data: OtpRequestedDto;
}

export class AuthResponseDto extends DataResponseDto<AuthDto> {
  @ApiProperty({ type: AuthDto })
  declare data: AuthDto;
}
