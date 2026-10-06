import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  toDataResponse,
  toListResponse,
} from '../../common/dto/api-response.dto.js';
import { i18nException } from '../../common/utils/i18n-exception.js';
import {
  AppointmentStatus,
  type Appointment,
  type Prisma,
  type User,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AppointmentDto,
  AppointmentListResponseDto,
  AppointmentResponseDto,
} from './dto/appointment-response.dto.js';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import type { QueryAppointmentDto } from './dto/query-appointment.dto.js';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

const TERMINAL_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.NO_SHOW,
];

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CANCELLED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

type CallerContext = {
  isPatient: boolean;
  isDoctor: boolean;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: User,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const caller = await this.resolveCaller(user.id);
    const { patientId, doctorId } = await this.resolveCreateParties(
      user,
      caller,
      dto,
    );

    await this.assertPatientExists(patientId);
    if (doctorId !== null) {
      await this.assertDoctorExists(doctorId);
    }

    const row = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        createdByUserId: user.id,
        appointmentAt: new Date(dto.appointmentAt),
        type: dto.type,
        status: AppointmentStatus.SCHEDULED,
        reason: dto.reason ?? null,
        notes: dto.notes ?? null,
      },
    });

    return toDataResponse(this.toResponse(row));
  }

  async findAll(
    user: User,
    query: QueryAppointmentDto,
  ): Promise<AppointmentListResponseDto> {
    const caller = await this.resolveCaller(user.id);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.AppointmentWhereInput = {
      AND: [this.accessWhere(user.id, caller), this.listFilters(query)],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        orderBy: { appointmentAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return toListResponse(
      rows.map((row) => this.toResponse(row)),
      { page, pageSize, total },
    );
  }

  async findOne(
    user: User,
    id: number,
  ): Promise<AppointmentResponseDto> {
    const row = await this.requireAccessible(user, id);
    return toDataResponse(this.toResponse(row));
  }

  async update(
    user: User,
    id: number,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const existing = await this.requireAccessible(user, id);
    const isTerminal = TERMINAL_STATUSES.includes(existing.status);

    if (isTerminal && dto.status !== undefined) {
      throw new BadRequestException(
        i18nException('appointments.errors.invalidStatusTransition', {
          status: dto.status,
        }),
      );
    }

    if (
      isTerminal &&
      (dto.appointmentAt !== undefined ||
        dto.type !== undefined ||
        dto.doctorId !== undefined ||
        dto.reason !== undefined ||
        dto.notes !== undefined)
    ) {
      throw new BadRequestException(
        i18nException('appointments.errors.invalidStatusTransition', {
          status: existing.status,
        }),
      );
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      this.assertStatusTransition(existing.status, dto.status);
    }

    if (dto.doctorId !== undefined && dto.doctorId !== null) {
      await this.assertDoctorExists(dto.doctorId);
    }

    const row = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.appointmentAt !== undefined
          ? { appointmentAt: new Date(dto.appointmentAt) }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.doctorId !== undefined ? { doctorId: dto.doctorId } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    return toDataResponse(this.toResponse(row));
  }

  private async resolveCaller(userId: number): Promise<CallerContext> {
    const [patientProfile, doctorProfile] = await Promise.all([
      this.prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      this.prisma.doctorProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
    ]);

    const isPatient = patientProfile !== null;
    const isDoctor = doctorProfile !== null;

    if (!isPatient && !isDoctor) {
      throw new ForbiddenException(
        i18nException('appointments.errors.forbidden'),
      );
    }

    return { isPatient, isDoctor };
  }

  private async resolveCreateParties(
    user: User,
    caller: CallerContext,
    dto: CreateAppointmentDto,
  ): Promise<{ patientId: number; doctorId: number | null }> {
    if (caller.isPatient && !caller.isDoctor) {
      if (dto.patientId !== undefined && dto.patientId !== user.id) {
        throw new ForbiddenException(
          i18nException('appointments.errors.forbidden'),
        );
      }
      return {
        patientId: user.id,
        doctorId: dto.doctorId === undefined ? null : dto.doctorId,
      };
    }

    if (caller.isDoctor && !caller.isPatient) {
      if (dto.patientId === undefined) {
        throw new BadRequestException(
          i18nException('appointments.errors.patientNotFound'),
        );
      }
      return {
        patientId: dto.patientId,
        doctorId:
          dto.doctorId === undefined
            ? user.id
            : dto.doctorId,
      };
    }

    // Both profiles: treat as patient path when no patientId, else doctor path.
    if (dto.patientId === undefined || dto.patientId === user.id) {
      return {
        patientId: user.id,
        doctorId: dto.doctorId === undefined ? null : dto.doctorId,
      };
    }

    return {
      patientId: dto.patientId,
      doctorId: dto.doctorId === undefined ? user.id : dto.doctorId,
    };
  }

  private async assertPatientExists(patientId: number): Promise<void> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(
        i18nException('appointments.errors.patientNotFound'),
      );
    }
  }

  private async assertDoctorExists(doctorId: number): Promise<void> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(
        i18nException('appointments.errors.doctorNotFound'),
      );
    }
  }

  private accessWhere(
    userId: number,
    caller: CallerContext,
  ): Prisma.AppointmentWhereInput {
    if (caller.isPatient && !caller.isDoctor) {
      return { patientId: userId };
    }
    if (caller.isDoctor && !caller.isPatient) {
      return {
        OR: [{ doctorId: userId }, { createdByUserId: userId }],
      };
    }
    return {
      OR: [
        { patientId: userId },
        { doctorId: userId },
        { createdByUserId: userId },
      ],
    };
  }

  private listFilters(query: QueryAppointmentDto): Prisma.AppointmentWhereInput {
    const filters: Prisma.AppointmentWhereInput = {};

    if (query.upcoming === true) {
      filters.appointmentAt = { gte: new Date() };
      filters.status =
        query.status !== undefined && !TERMINAL_STATUSES.includes(query.status)
          ? query.status
          : { notIn: TERMINAL_STATUSES };
      return filters;
    }

    if (query.status !== undefined) {
      filters.status = query.status;
    }

    return filters;
  }

  private async requireAccessible(
    user: User,
    id: number,
  ): Promise<Appointment> {
    const caller = await this.resolveCaller(user.id);
    const row = await this.prisma.appointment.findFirst({
      where: {
        id,
        AND: [this.accessWhere(user.id, caller)],
      },
    });

    if (!row) {
      throw new NotFoundException(
        i18nException('appointments.errors.notFound'),
      );
    }

    return row;
  }

  private assertStatusTransition(
    from: AppointmentStatus,
    to: AppointmentStatus,
  ): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        i18nException('appointments.errors.invalidStatusTransition', {
          status: to,
        }),
      );
    }
  }

  private toResponse(row: Appointment): AppointmentDto {
    return {
      id: row.id,
      patientId: row.patientId,
      doctorId: row.doctorId,
      createdByUserId: row.createdByUserId,
      appointmentAt: row.appointmentAt.toISOString(),
      type: row.type,
      status: row.status,
      reason: row.reason,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
