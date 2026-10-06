import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { toDataResponse } from '../../common/dto/api-response.dto.js';
import { i18nException } from '../../common/utils/i18n-exception.js';
import {
  Prisma,
  type Gender,
  type PatientProfile,
  type User,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { EmergencyContactDto } from './dto/emergency-contact.dto.js';
import type {
  EmergencyContactResponseDto,
  PatientDto,
  PatientResponseDto,
  PhoneResponseDto,
} from './dto/patient-response.dto.js';
import type { UpdatePatientDto } from './dto/update-patient.dto.js';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: User): Promise<PatientResponseDto> {
    const profile = await this.findByUserId(user.id);
    return toDataResponse(this.toResponse(user, profile));
  }

  async updateMe(
    user: User,
    dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    await this.assertOnboardingCompleted(user.id);

    try {
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            ...(dto.fullName !== undefined ? { name: dto.fullName } : {}),
            ...(dto.email !== undefined ? { email: dto.email } : {}),
            ...(dto.preferredLanguage !== undefined
              ? { preferredLanguage: dto.preferredLanguage }
              : {}),
          },
        });
        await this.applyProfilePatch(tx, user.id, dto);
        return updatedUser;
      });

      const profile = await this.findByUserId(user.id);
      return toDataResponse(this.toResponse(updatedUser, profile));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          i18nException('patients.errors.emailTaken'),
        );
      }
      throw error;
    }
  }

  findByUserId(userId: number): Promise<PatientProfile | null> {
    return this.prisma.patientProfile.findUnique({ where: { userId } });
  }

  async upsertDemographics(
    userId: number,
    data: {
      dateOfBirth: string;
      gender: Gender;
      profilePhotoUrl: string | null;
    },
    tx: Prisma.TransactionClient,
  ): Promise<PatientProfile> {
    const dateOfBirth = this.parseDateOfBirth(data.dateOfBirth);
    return tx.patientProfile.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth,
        gender: data.gender,
        profilePhotoUrl: data.profilePhotoUrl,
      },
      update: {
        dateOfBirth,
        gender: data.gender,
        profilePhotoUrl: data.profilePhotoUrl,
      },
    });
  }

  upsertEmergencyContact(
    userId: number,
    dto: EmergencyContactDto,
  ): Promise<PatientProfile> {
    return this.prisma.patientProfile.upsert({
      where: { userId },
      create: {
        userId,
        emergencyContact: this.toEmergencyContactJson(dto),
      },
      update: {
        emergencyContact: this.toEmergencyContactJson(dto),
      },
    });
  }

  toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  ageFromDob(dateOfBirth: Date, now = new Date()): number {
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

  toEmergencyContact(
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

  private async assertOnboardingCompleted(userId: number): Promise<void> {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { userId },
      select: { completed: true },
    });

    if (!onboarding?.completed) {
      throw new ConflictException(
        i18nException('patients.errors.onboardingIncomplete'),
      );
    }
  }

  private async applyProfilePatch(
    tx: Prisma.TransactionClient,
    userId: number,
    dto: UpdatePatientDto,
  ): Promise<void> {
    const create: Prisma.PatientProfileUncheckedCreateInput = { userId };
    const update: Prisma.PatientProfileUncheckedUpdateInput = {};

    if (dto.dateOfBirth !== undefined) {
      const dateOfBirth = this.parseDateOfBirth(dto.dateOfBirth);
      create.dateOfBirth = dateOfBirth;
      update.dateOfBirth = dateOfBirth;
    }
    if (dto.gender !== undefined) {
      create.gender = dto.gender;
      update.gender = dto.gender;
    }
    if (dto.profilePhotoUrl !== undefined) {
      create.profilePhotoUrl = dto.profilePhotoUrl;
      update.profilePhotoUrl = dto.profilePhotoUrl;
    }
    if (dto.bloodGroup !== undefined) {
      create.bloodGroup = dto.bloodGroup;
      update.bloodGroup = dto.bloodGroup;
    }
    if (dto.emergencyContact !== undefined) {
      const emergencyContact = this.toEmergencyContactJson(
        dto.emergencyContact,
      );
      create.emergencyContact = emergencyContact;
      update.emergencyContact = emergencyContact;
    }

    if (Object.keys(update).length === 0) {
      return;
    }

    await tx.patientProfile.upsert({
      where: { userId },
      create,
      update,
    });
  }

  private toEmergencyContactJson(
    dto: EmergencyContactDto,
  ): Prisma.InputJsonValue {
    const value = {
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
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private parseDateOfBirth(isoDate: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) {
      throw new BadRequestException(
        i18nException('patients.errors.invalidDateOfBirth'),
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
        i18nException('patients.errors.invalidDateOfBirth'),
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
        i18nException('patients.errors.invalidDateOfBirth'),
      );
    }

    return dateOfBirth;
  }

  private toResponse(
    user: User,
    profile: PatientProfile | null,
  ): PatientDto {
    return {
      fullName: user.name,
      email: user.email,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
      dateOfBirth: profile?.dateOfBirth
        ? this.toIsoDate(profile.dateOfBirth)
        : null,
      age: profile?.dateOfBirth ? this.ageFromDob(profile.dateOfBirth) : null,
      gender: profile?.gender ?? null,
      profilePhotoUrl: profile?.profilePhotoUrl ?? null,
      bloodGroup: profile?.bloodGroup ?? null,
      emergencyContact: this.toEmergencyContact(profile?.emergencyContact),
    };
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
