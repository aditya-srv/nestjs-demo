import { ApiProperty } from '@nestjs/swagger';
import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
import { Gender } from '../../../generated/prisma/client.js';
import { EmergencyContactResponseDto } from '../../patients/dto/patient-response.dto.js';
import { AllergySeverity, AllergyType } from './save-allergies.dto.js';

export const ONBOARDING_STEPS = [
  'basicDetails',
  'emergencyContact',
  'medicalHistory',
  'allergies',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export class BasicDetailsResponseDto {
  @ApiProperty({ example: 'Priya Sharma', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: '1990-05-15', nullable: true })
  dateOfBirth: string | null;

  @ApiProperty({ example: 35, nullable: true })
  age: number | null;

  @ApiProperty({ enum: Gender, nullable: true, example: Gender.FEMALE })
  gender: Gender | null;

  @ApiProperty({ example: '91', nullable: true })
  countryCode: string | null;

  @ApiProperty({ example: '9876543210', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'priya@example.com', nullable: true })
  email: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/photos/priya.jpg',
    nullable: true,
  })
  profilePhotoUrl: string | null;

  @ApiProperty({ example: 'en' })
  preferredLanguage: string;
}

export class SurgeryResponseDto {
  @ApiProperty({ example: 'Appendectomy' })
  name: string;

  @ApiProperty({ example: 2018, nullable: true })
  year: number | null;
}

export class MedicalHistoryResponseDto {
  @ApiProperty({
    type: [String],
    example: ['Hypertension', 'Type 2 Diabetes'],
  })
  chronicConditions: string[];

  @ApiProperty({ type: [SurgeryResponseDto] })
  surgeries: SurgeryResponseDto[];
}

export class AllergyResponseDto {
  @ApiProperty({ example: 'Penicillin' })
  name: string;

  @ApiProperty({ enum: AllergyType, example: AllergyType.DRUG })
  type: AllergyType;

  @ApiProperty({ enum: AllergySeverity, example: AllergySeverity.SEVERE })
  severity: AllergySeverity;

  @ApiProperty({ example: 'Anaphylaxis' })
  reaction: string;
}

export class OnboardingDto {
  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({
    isArray: true,
    enum: ONBOARDING_STEPS,
    example: ['basicDetails', 'emergencyContact'],
  })
  draftedSteps: OnboardingStep[];

  @ApiProperty({ type: BasicDetailsResponseDto })
  basicDetails: BasicDetailsResponseDto;

  @ApiProperty({ type: EmergencyContactResponseDto, nullable: true })
  emergencyContact: EmergencyContactResponseDto | null;

  @ApiProperty({ type: MedicalHistoryResponseDto, nullable: true })
  medicalHistory: MedicalHistoryResponseDto | null;

  @ApiProperty({ type: [AllergyResponseDto], nullable: true })
  allergies: AllergyResponseDto[] | null;
}

export class OnboardingResponseDto extends DataResponseDto<OnboardingDto> {
  @ApiProperty({ type: OnboardingDto })
  declare data: OnboardingDto;
}
