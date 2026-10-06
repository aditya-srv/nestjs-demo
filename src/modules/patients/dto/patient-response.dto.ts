import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
import type { Gender } from '../../../generated/prisma/client.js';

export class PhoneResponseDto {
  countryCode: string;
  phoneNumber: string;
}

export class EmergencyContactResponseDto {
  name: string;
  relationship: string;
  phone: PhoneResponseDto;
  alternatePhone: PhoneResponseDto | null;
}

export class PatientDto {
  fullName: string | null;
  email: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  profilePhotoUrl: string | null;
  bloodGroup: string | null;
  emergencyContact: EmergencyContactResponseDto | null;
}

export class PatientResponseDto extends DataResponseDto<PatientDto> {
  declare data: PatientDto;
}
