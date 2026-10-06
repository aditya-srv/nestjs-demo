import { ConflictException, Injectable } from '@nestjs/common';
import { toDataResponse } from '../../common/dto/api-response.dto.js';
import { i18nException } from '../../common/utils/i18n-exception.js';
import {
  Prisma,
  type DoctorProfile,
  type User,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  DoctorDto,
  DoctorResponseDto,
} from './dto/doctor-response.dto.js';
import type { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: User): Promise<DoctorResponseDto> {
    const profile = await this.findByUserId(user.id);
    return toDataResponse(this.toResponse(user, profile));
  }

  async updateMe(
    user: User,
    dto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
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
        throw new ConflictException(i18nException('doctors.errors.emailTaken'));
      }
      throw error;
    }
  }

  findByUserId(userId: number): Promise<DoctorProfile | null> {
    return this.prisma.doctorProfile.findUnique({ where: { userId } });
  }

  private async applyProfilePatch(
    tx: Prisma.TransactionClient,
    userId: number,
    dto: UpdateDoctorDto,
  ): Promise<void> {
    if (dto.specialization === undefined) {
      return;
    }

    await tx.doctorProfile.upsert({
      where: { userId },
      create: {
        userId,
        specialization: dto.specialization,
      },
      update: {
        specialization: dto.specialization,
      },
    });
  }

  private toResponse(
    user: User,
    profile: DoctorProfile | null,
  ): DoctorDto {
    return {
      fullName: user.name,
      email: user.email,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
      specialization: profile?.specialization ?? null,
    };
  }
}
