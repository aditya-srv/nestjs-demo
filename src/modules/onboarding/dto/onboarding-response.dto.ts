import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
import type { Gender } from '../../../generated/prisma/client.js';
import type { EmergencyContactResponseDto } from '../../patients/dto/patient-response.dto.js';
import type { AllergySeverity, AllergyType } from './save-allergies.dto.js';

export const ONBOARDING_STEPS = [
  'basicDetails',
  'emergencyContact',
  'medicalHistory',
  'allergies',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export class BasicDetailsResponseDto {
  fullName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  countryCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  preferredLanguage: string;
}

export class SurgeryResponseDto {
  name: string;
  year: number | null;
}

export class MedicalHistoryResponseDto {
  chronicConditions: string[];
  surgeries: SurgeryResponseDto[];
}

export class AllergyResponseDto {
  name: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
}

export class OnboardingDto {
  completed: boolean;
  draftedSteps: OnboardingStep[];
  basicDetails: BasicDetailsResponseDto;
  emergencyContact: EmergencyContactResponseDto | null;
  medicalHistory: MedicalHistoryResponseDto | null;
  allergies: AllergyResponseDto[] | null;
}

export class OnboardingResponseDto extends DataResponseDto<OnboardingDto> {
  declare data: OnboardingDto;
}
