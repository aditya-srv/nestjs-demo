import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { toDataResponse } from '../../common/dto/api-response.dto.js';
import { i18nException } from '../../common/utils/i18n-exception.js';
import {
  Prisma,
  Role,
  type Onboarding,
  type PatientProfile,
  type User,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EmergencyContactDto } from '../patients/dto/emergency-contact.dto.js';
import { PatientsService } from '../patients/patients.service.js';
import type { SaveAllergiesDto } from './dto/save-allergies.dto.js';
import type { SaveBasicDetailsDto } from './dto/save-basic-details.dto.js';
import type { SaveMedicalHistoryDto } from './dto/save-medical-history.dto.js';
import {
  ONBOARDING_STEPS,
  type AllergyResponseDto,
  type MedicalHistoryResponseDto,
  type OnboardingDto,
  type OnboardingResponseDto,
  type OnboardingStep,
} from './dto/onboarding-response.dto.js';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patients: PatientsService,
  ) {}

  async get(user: User): Promise<OnboardingResponseDto> {
    const [onboarding, profile] = await Promise.all([
      this.prisma.onboarding.findUnique({
        where: { userId: user.id },
      }),
      this.patients.findByUserId(user.id),
    ]);
    return toDataResponse(this.toResponse(user, profile, onboarding));
  }

  async saveBasicDetails(
    user: User,
    dto: SaveBasicDetailsDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    try {
      const [updatedUser, profile] = await this.prisma.$transaction(
        async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
              name: dto.fullName,
              email: dto.email,
              ...(dto.preferredLanguage
                ? { preferredLanguage: dto.preferredLanguage }
                : {}),
            },
          });

          const profile = await this.patients.upsertDemographics(
            user.id,
            {
              dateOfBirth: dto.dateOfBirth,
              gender: dto.gender,
              profilePhotoUrl: dto.profilePhotoUrl ?? null,
            },
            tx,
          );

          return [updatedUser, profile] as const;
        },
      );

      const onboarding = await this.prisma.onboarding.findUnique({
        where: { userId: user.id },
      });
      return toDataResponse(this.toResponse(updatedUser, profile, onboarding));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          i18nException('onboarding.errors.emailTaken'),
        );
      }
      throw error;
    }
  }

  async saveEmergencyContact(
    user: User,
    dto: EmergencyContactDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    const profile = await this.patients.upsertEmergencyContact(user.id, dto);
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { userId: user.id },
    });
    return toDataResponse(this.toResponse(user, profile, onboarding));
  }

  async saveMedicalHistory(
    user: User,
    dto: SaveMedicalHistoryDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    const medicalHistory: MedicalHistoryResponseDto = {
      chronicConditions: dto.chronicConditions,
      surgeries: dto.surgeries.map((surgery) => ({
        name: surgery.name,
        year: surgery.year ?? null,
      })),
    };

    const [onboarding, profile] = await Promise.all([
      this.upsertStep(user.id, {
        medicalHistory: this.toJsonValue(medicalHistory),
      }),
      this.patients.findByUserId(user.id),
    ]);
    return toDataResponse(this.toResponse(user, profile, onboarding));
  }

  async saveAllergies(
    user: User,
    dto: SaveAllergiesDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    const [onboarding, profile] = await Promise.all([
      this.upsertStep(user.id, {
        allergies: this.toJsonValue(dto.allergies),
      }),
      this.patients.findByUserId(user.id),
    ]);
    return toDataResponse(this.toResponse(user, profile, onboarding));
  }

  async complete(user: User): Promise<OnboardingResponseDto> {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { userId: user.id },
    });

    if (onboarding?.completed) {
      throw new ConflictException(
        i18nException('onboarding.errors.alreadyCompleted'),
      );
    }

    const profile = await this.patients.findByUserId(user.id);
    const draftedSteps = this.draftedSteps(user, profile, onboarding);
    if (draftedSteps.length !== ONBOARDING_STEPS.length) {
      throw new BadRequestException(
        i18nException('onboarding.errors.incomplete'),
      );
    }

    const [updatedUser, updatedOnboarding] = await this.prisma.$transaction(
      async (tx) => {
        const updatedOnboarding = await tx.onboarding.update({
          where: { userId: user.id },
          data: {
            completed: true,
            completedAt: new Date(),
          },
        });
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { role: Role.PATIENT },
        });
        return [updatedUser, updatedOnboarding] as const;
      },
    );

    return toDataResponse(
      this.toResponse(updatedUser, profile, updatedOnboarding),
    );
  }

  private async assertNotCompleted(userId: number): Promise<void> {
    const existing = await this.prisma.onboarding.findUnique({
      where: { userId },
      select: { completed: true },
    });

    if (existing?.completed) {
      throw new ConflictException(
        i18nException('onboarding.errors.alreadyCompleted'),
      );
    }
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async upsertStep(
    userId: number,
    data: {
      medicalHistory?: Prisma.InputJsonValue;
      allergies?: Prisma.InputJsonValue;
    },
  ): Promise<Onboarding> {
    return this.prisma.onboarding.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  private draftedSteps(
    user: User,
    profile: PatientProfile | null,
    onboarding: Onboarding | null,
  ): OnboardingStep[] {
    const steps: OnboardingStep[] = [];

    if (user.name && user.email && profile?.dateOfBirth && profile.gender) {
      steps.push('basicDetails');
    }

    if (profile?.emergencyContact != null) {
      steps.push('emergencyContact');
    }

    if (onboarding?.medicalHistory != null) {
      steps.push('medicalHistory');
    }

    if (onboarding?.allergies != null) {
      steps.push('allergies');
    }

    return steps;
  }

  private toResponse(
    user: User,
    profile: PatientProfile | null,
    onboarding: Onboarding | null,
  ): OnboardingDto {
    return {
      completed: onboarding?.completed ?? false,
      draftedSteps: this.draftedSteps(user, profile, onboarding),
      basicDetails: {
        fullName: user.name,
        dateOfBirth: profile?.dateOfBirth
          ? this.patients.toIsoDate(profile.dateOfBirth)
          : null,
        age: profile?.dateOfBirth
          ? this.patients.ageFromDob(profile.dateOfBirth)
          : null,
        gender: profile?.gender ?? null,
        countryCode: user.countryCode,
        phoneNumber: user.phoneNumber,
        email: user.email,
        profilePhotoUrl: profile?.profilePhotoUrl ?? null,
        preferredLanguage: user.preferredLanguage,
      },
      emergencyContact: this.patients.toEmergencyContact(
        profile?.emergencyContact,
      ),
      medicalHistory: this.toMedicalHistory(onboarding?.medicalHistory),
      allergies: this.toAllergies(onboarding?.allergies),
    };
  }

  private toMedicalHistory(
    value: Prisma.JsonValue | null | undefined,
  ): MedicalHistoryResponseDto | null {
    const record = this.asRecord(value);
    if (!record || !Array.isArray(record.chronicConditions)) {
      return null;
    }

    const surgeries = Array.isArray(record.surgeries)
      ? record.surgeries.flatMap((item) => {
          const surgery = this.asRecord(item);
          if (!surgery || typeof surgery.name !== 'string') {
            return [];
          }
          return [
            {
              name: surgery.name,
              year: typeof surgery.year === 'number' ? surgery.year : null,
            },
          ];
        })
      : [];

    return {
      chronicConditions: record.chronicConditions.filter(
        (item): item is string => typeof item === 'string',
      ),
      surgeries,
    };
  }

  private toAllergies(
    value: Prisma.JsonValue | null | undefined,
  ): AllergyResponseDto[] | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!Array.isArray(value)) {
      return null;
    }

    return value.flatMap((item) => {
      const allergy = this.asRecord(item);
      if (
        !allergy ||
        typeof allergy.name !== 'string' ||
        typeof allergy.type !== 'string' ||
        typeof allergy.severity !== 'string' ||
        typeof allergy.reaction !== 'string'
      ) {
        return [];
      }

      return [
        {
          name: allergy.name,
          type: allergy.type as AllergyResponseDto['type'],
          severity: allergy.severity as AllergyResponseDto['severity'],
          reaction: allergy.reaction,
        },
      ];
    });
  }

  private asRecord(
    value: Prisma.JsonValue | null | undefined,
  ): Prisma.JsonObject | null {
    if (value === null || value === undefined || typeof value !== 'object') {
      return null;
    }
    if (Array.isArray(value)) {
      return null;
    }
    return value;
  }
}
