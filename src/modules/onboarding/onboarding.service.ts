import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { i18nException } from '../../common/utils/i18n-exception.js';
import {
  Prisma,
  Role,
  type Onboarding,
  type User,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SaveAllergiesDto } from './dto/save-allergies.dto.js';
import type { SaveBasicDetailsDto } from './dto/save-basic-details.dto.js';
import type { SaveEmergencyContactDto } from './dto/save-emergency-contact.dto.js';
import type { SaveMedicalHistoryDto } from './dto/save-medical-history.dto.js';
import {
  ONBOARDING_STEPS,
  type AllergyResponseDto,
  type EmergencyContactResponseDto,
  type MedicalHistoryResponseDto,
  type OnboardingResponseDto,
  type OnboardingStep,
  type PhoneResponseDto,
} from './dto/onboarding-response.dto.js';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: User): Promise<OnboardingResponseDto> {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { userId: user.id },
    });
    return this.toResponse(user, onboarding);
  }

  async saveBasicDetails(
    user: User,
    dto: SaveBasicDetailsDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);
    const dateOfBirth = this.parseDateOfBirth(dto.dateOfBirth);

    try {
      const [updatedUser, onboarding] = await this.prisma.$transaction(
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

          const onboarding = await tx.onboarding.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              dateOfBirth,
              gender: dto.gender,
              profilePhotoUrl: dto.profilePhotoUrl ?? null,
            },
            update: {
              dateOfBirth,
              gender: dto.gender,
              profilePhotoUrl: dto.profilePhotoUrl ?? null,
            },
          });

          return [updatedUser, onboarding] as const;
        },
      );

      return this.toResponse(updatedUser, onboarding);
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
    dto: SaveEmergencyContactDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    const emergencyContact: EmergencyContactResponseDto = {
      name: dto.name,
      relationship: dto.relationship,
      phone: {
        countryCode: dto.phone.countryCode,
        phoneNumber: dto.phone.phoneNumber,
      },
      alternatePhone: dto.alternatePhone
        ? {
            countryCode: dto.alternatePhone.countryCode,
            phoneNumber: dto.alternatePhone.phoneNumber,
          }
        : null,
    };

    const onboarding = await this.upsertStep(user.id, {
      emergencyContact: this.toJsonValue(emergencyContact),
    });
    return this.toResponse(user, onboarding);
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

    const onboarding = await this.upsertStep(user.id, {
      medicalHistory: this.toJsonValue(medicalHistory),
    });
    return this.toResponse(user, onboarding);
  }

  async saveAllergies(
    user: User,
    dto: SaveAllergiesDto,
  ): Promise<OnboardingResponseDto> {
    await this.assertNotCompleted(user.id);

    const onboarding = await this.upsertStep(user.id, {
      allergies: this.toJsonValue(dto.allergies),
    });
    return this.toResponse(user, onboarding);
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

    const draftedSteps = this.draftedSteps(user, onboarding);
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

    return this.toResponse(updatedUser, updatedOnboarding);
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
      emergencyContact?: Prisma.InputJsonValue;
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

  private parseDateOfBirth(isoDate: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) {
      throw new BadRequestException(
        i18nException('onboarding.errors.invalidDateOfBirth'),
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const dateOfBirth = new Date(Date.UTC(year, month - 1, day));

    if (
      dateOfBirth.getUTCFullYear() !== year ||
      dateOfBirth.getUTCMonth() !== month - 1 ||
      dateOfBirth.getUTCDate() !== day
    ) {
      throw new BadRequestException(
        i18nException('onboarding.errors.invalidDateOfBirth'),
      );
    }

    const now = new Date();
    const todayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    if (dateOfBirth.getTime() > todayUtc) {
      throw new BadRequestException(
        i18nException('onboarding.errors.invalidDateOfBirth'),
      );
    }

    return dateOfBirth;
  }

  private draftedSteps(
    user: User,
    onboarding: Onboarding | null,
  ): OnboardingStep[] {
    const steps: OnboardingStep[] = [];

    if (
      user.name &&
      user.email &&
      onboarding?.dateOfBirth &&
      onboarding.gender
    ) {
      steps.push('basicDetails');
    }

    if (onboarding?.emergencyContact != null) {
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
    onboarding: Onboarding | null,
  ): OnboardingResponseDto {
    return {
      completed: onboarding?.completed ?? false,
      draftedSteps: this.draftedSteps(user, onboarding),
      basicDetails: {
        fullName: user.name,
        dateOfBirth: onboarding?.dateOfBirth
          ? this.toIsoDate(onboarding.dateOfBirth)
          : null,
        age: onboarding?.dateOfBirth
          ? this.ageFromDob(onboarding.dateOfBirth)
          : null,
        gender: onboarding?.gender ?? null,
        countryCode: user.countryCode,
        phoneNumber: user.phoneNumber,
        email: user.email,
        profilePhotoUrl: onboarding?.profilePhotoUrl ?? null,
        preferredLanguage: user.preferredLanguage,
      },
      emergencyContact: this.toEmergencyContact(onboarding?.emergencyContact),
      medicalHistory: this.toMedicalHistory(onboarding?.medicalHistory),
      allergies: this.toAllergies(onboarding?.allergies),
    };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private ageFromDob(dateOfBirth: Date, now = new Date()): number {
    const birth = new Date(
      Date.UTC(
        dateOfBirth.getUTCFullYear(),
        dateOfBirth.getUTCMonth(),
        dateOfBirth.getUTCDate(),
      ),
    );
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())
    ) {
      age -= 1;
    }
    return age;
  }

  private toEmergencyContact(
    value: Prisma.JsonValue | null | undefined,
  ): EmergencyContactResponseDto | null {
    const record = this.asRecord(value);
    if (!record) {
      return null;
    }

    const phone = this.asPhone(record.phone);
    if (
      typeof record.name !== 'string' ||
      typeof record.relationship !== 'string' ||
      !phone
    ) {
      return null;
    }

    return {
      name: record.name,
      relationship: record.relationship,
      phone,
      alternatePhone: this.asPhone(record.alternatePhone),
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

  private asPhone(
    value: Prisma.JsonValue | null | undefined,
  ): PhoneResponseDto | null {
    const record = this.asRecord(value);
    if (
      !record ||
      typeof record.countryCode !== 'string' ||
      typeof record.phoneNumber !== 'string'
    ) {
      return null;
    }

    return {
      countryCode: record.countryCode,
      phoneNumber: record.phoneNumber,
    };
  }
}
