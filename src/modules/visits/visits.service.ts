import {
  BadRequestException,
  ConflictException,
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
  type Diagnosis,
  type MedicalReport,
  type PrescriptionItem,
  type Prisma,
  type Medicine,
  type User,
  type Visit,
  type VisitDiagnosis,
  type VisitFollowUp,
  type VisitNote,
  type VisitVital,
  VisitStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateMedicalReportDto } from './dto/create-visit.dto.js';
import type {
  CreatePrescriptionDto,
  CreatePrescriptionItemDto,
  CreateVisitDiagnosisDto,
  CreateVisitDto,
  CreateVisitFollowUpDto,
  CreateVisitNoteDto,
  CreateVisitVitalDto,
} from './dto/create-visit.dto.js';
import type { QueryVisitDto } from './dto/query-visit.dto.js';
import type { UpdateVisitDto } from './dto/update-visit.dto.js';
import type {
  DiagnosisDto,
  MedicalReportDto,
  MedicalReportResponseDto,
  MedicineDto,
  PrescriptionDto,
  PrescriptionItemDto,
  PrescriptionResponseDto,
  VisitDetailDto,
  VisitDiagnosisDto,
  VisitDiagnosisResponseDto,
  VisitDto,
  VisitFollowUpDto,
  VisitFollowUpResponseDto,
  VisitListResponseDto,
  VisitNoteDto,
  VisitNoteResponseDto,
  VisitResponseDto,
  VisitVitalDto,
  VisitVitalResponseDto,
} from './dto/visit-response.dto.js';

const LINKABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
];

const prescriptionInclude = {
  items: {
    include: { medicine: true },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.PrescriptionInclude;

const visitInclude = {
  diagnoses: {
    include: { diagnosis: true },
    orderBy: { id: 'asc' as const },
  },
  vitals: { orderBy: { recordedAt: 'asc' as const } },
  prescriptions: {
    include: prescriptionInclude,
    orderBy: { id: 'asc' as const },
  },
  reports: { orderBy: { id: 'asc' as const } },
  notes: { orderBy: { createdAt: 'asc' as const } },
  followUps: { orderBy: { recommendedDate: 'asc' as const } },
} satisfies Prisma.VisitInclude;

type Tx = Prisma.TransactionClient;
type VisitDetailRecord = Prisma.VisitGetPayload<{
  include: typeof visitInclude;
}>;
type PrescriptionRecord = Prisma.PrescriptionGetPayload<{
  include: typeof prescriptionInclude;
}>;
type VisitDiagnosisRecord = VisitDiagnosis & { diagnosis: Diagnosis };
type PrescriptionItemRecord = PrescriptionItem & { medicine: Medicine };

type CallerContext = {
  isPatient: boolean;
  isDoctor: boolean;
};

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, dto: CreateVisitDto): Promise<VisitResponseDto> {
    const caller = await this.resolveCaller(user.id);
    if (!caller.isDoctor) {
      throw new ForbiddenException(i18nException('visits.errors.doctorOnly'));
    }

    await this.assertPatientExists(dto.patientId);

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.appointmentId !== undefined) {
        await this.linkAppointment(
          tx,
          dto.appointmentId,
          dto.patientId,
          user.id,
        );
      }

      const visit = await tx.visit.create({
        data: {
          patientId: dto.patientId,
          doctorId: user.id,
          appointmentId: dto.appointmentId ?? null,
          visitedAt: new Date(dto.visitedAt),
          type: dto.type,
          reason: dto.reason ?? null,
          status: VisitStatus.OPEN,
        },
      });

      await this.createChildren(tx, visit, user.id, dto);

      return tx.visit.findUniqueOrThrow({
        where: { id: visit.id },
        include: visitInclude,
      });
    });

    return toDataResponse(this.toDetail(row));
  }

  async findAll(
    user: User,
    query: QueryVisitDto,
  ): Promise<VisitListResponseDto> {
    const caller = await this.resolveCaller(user.id);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.VisitWhereInput = {
      AND: [this.accessWhere(user.id, caller), this.listFilters(query)],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        orderBy: [{ visitedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.visit.count({ where }),
    ]);

    return toListResponse(
      rows.map((row) => this.toSummary(row)),
      { page, pageSize, total },
    );
  }

  async findOne(user: User, id: number): Promise<VisitResponseDto> {
    await this.requireAccessible(user, id);
    const row = await this.prisma.visit.findUniqueOrThrow({
      where: { id },
      include: visitInclude,
    });
    return toDataResponse(this.toDetail(row));
  }

  async update(
    user: User,
    id: number,
    dto: UpdateVisitDto,
  ): Promise<VisitResponseDto> {
    const existing = await this.requireConductingDoctor(user, id);

    if (dto.status !== undefined && dto.status !== existing.status) {
      if (
        existing.status !== VisitStatus.OPEN ||
        dto.status !== VisitStatus.COMPLETED
      ) {
        throw new BadRequestException(
          i18nException('visits.errors.invalidStatusTransition', {
            status: dto.status,
          }),
        );
      }
    }

    await this.prisma.visit.update({
      where: { id },
      data: {
        ...(dto.visitedAt !== undefined
          ? { visitedAt: new Date(dto.visitedAt) }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    const row = await this.prisma.visit.findUniqueOrThrow({
      where: { id },
      include: visitInclude,
    });
    return toDataResponse(this.toDetail(row));
  }

  async addDiagnosis(
    user: User,
    visitId: number,
    dto: CreateVisitDiagnosisDto,
  ): Promise<VisitDiagnosisResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.$transaction((tx) =>
      this.createDiagnosisLink(tx, visit, dto),
    );
    return toDataResponse(this.toVisitDiagnosis(row));
  }

  async addVital(
    user: User,
    visitId: number,
    dto: CreateVisitVitalDto,
  ): Promise<VisitVitalResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.visitVital.create({
      data: {
        visitId: visit.id,
        type: dto.type,
        value: dto.value,
        unit: dto.unit ?? null,
        ...(dto.recordedAt !== undefined
          ? { recordedAt: new Date(dto.recordedAt) }
          : {}),
      },
    });
    return toDataResponse(this.toVital(row));
  }

  async addNote(
    user: User,
    visitId: number,
    dto: CreateVisitNoteDto,
  ): Promise<VisitNoteResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.visitNote.create({
      data: {
        visitId: visit.id,
        noteType: dto.noteType,
        content: dto.content,
        authorId: user.id,
      },
    });
    return toDataResponse(this.toNote(row));
  }

  async addFollowUp(
    user: User,
    visitId: number,
    dto: CreateVisitFollowUpDto,
  ): Promise<VisitFollowUpResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.visitFollowUp.create({
      data: {
        visitId: visit.id,
        recommendedDate: new Date(dto.recommendedDate),
        instructions: dto.instructions ?? null,
      },
    });
    return toDataResponse(this.toFollowUp(row));
  }

  async addPrescription(
    user: User,
    visitId: number,
    dto: CreatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.$transaction((tx) =>
      this.createPrescription(tx, visit, user.id, dto),
    );
    return toDataResponse(this.toPrescription(row));
  }

  async addReport(
    user: User,
    visitId: number,
    dto: CreateMedicalReportDto,
  ): Promise<MedicalReportResponseDto> {
    const visit = await this.requireOpenVisit(user, visitId);
    const row = await this.prisma.medicalReport.create({
      data: this.reportData(visit, dto),
    });
    return toDataResponse(this.toReport(row));
  }

  private async createChildren(
    tx: Tx,
    visit: Visit,
    doctorId: number,
    dto: CreateVisitDto,
  ): Promise<void> {
    for (const diagnosis of dto.diagnoses ?? []) {
      await this.createDiagnosisLink(tx, visit, diagnosis);
    }
    for (const vital of dto.vitals ?? []) {
      await tx.visitVital.create({
        data: {
          visitId: visit.id,
          type: vital.type,
          value: vital.value,
          unit: vital.unit ?? null,
          ...(vital.recordedAt !== undefined
            ? { recordedAt: new Date(vital.recordedAt) }
            : {}),
        },
      });
    }
    for (const note of dto.notes ?? []) {
      await tx.visitNote.create({
        data: {
          visitId: visit.id,
          noteType: note.noteType,
          content: note.content,
          authorId: doctorId,
        },
      });
    }
    for (const followUp of dto.followUps ?? []) {
      await tx.visitFollowUp.create({
        data: {
          visitId: visit.id,
          recommendedDate: new Date(followUp.recommendedDate),
          instructions: followUp.instructions ?? null,
        },
      });
    }
    for (const prescription of dto.prescriptions ?? []) {
      await this.createPrescription(tx, visit, doctorId, prescription);
    }
    for (const report of dto.reports ?? []) {
      await tx.medicalReport.create({
        data: this.reportData(visit, report),
      });
    }
  }

  private async createDiagnosisLink(
    tx: Tx,
    visit: Visit,
    dto: CreateVisitDiagnosisDto,
  ): Promise<VisitDiagnosisRecord> {
    const diagnosisId = await this.resolveDiagnosisId(tx, visit, dto);
    return tx.visitDiagnosis.create({
      data: {
        visitId: visit.id,
        diagnosisId,
        notes: dto.notes ?? null,
        isPrimary: dto.isPrimary ?? false,
      },
      include: { diagnosis: true },
    });
  }

  private async resolveDiagnosisId(
    tx: Tx,
    visit: Visit,
    dto: CreateVisitDiagnosisDto,
  ): Promise<number> {
    if (dto.diagnosisId != null) {
      const existing = await tx.diagnosis.findFirst({
        where: { id: dto.diagnosisId, patientId: visit.patientId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException(
          i18nException('visits.errors.diagnosisNotFound'),
        );
      }
      return existing.id;
    }

    const created = await tx.diagnosis.create({
      data: {
        patientId: visit.patientId,
        name: dto.name ?? '',
        code: dto.code ?? null,
        type: dto.type!,
        status: dto.status!,
        severity: dto.severity ?? null,
        diagnosedOn: toDateOnly(
          dto.diagnosedOn ?? visit.visitedAt.toISOString(),
        ),
      },
      select: { id: true },
    });
    return created.id;
  }

  private async createPrescription(
    tx: Tx,
    visit: Visit,
    doctorId: number,
    dto: CreatePrescriptionDto,
  ): Promise<PrescriptionRecord> {
    const prescription = await tx.prescription.create({
      data: {
        visitId: visit.id,
        patientId: visit.patientId,
        prescribedById: doctorId,
        notes: dto.notes ?? null,
      },
    });

    for (const item of dto.items) {
      const medicineId = await this.resolveMedicineId(tx, item);
      await tx.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions ?? null,
          startDate:
            item.startDate === undefined ? null : toDateOnly(item.startDate),
          endDate: item.endDate === undefined ? null : toDateOnly(item.endDate),
        },
      });
    }

    return tx.prescription.findUniqueOrThrow({
      where: { id: prescription.id },
      include: prescriptionInclude,
    });
  }

  private async resolveMedicineId(
    tx: Tx,
    item: CreatePrescriptionItemDto,
  ): Promise<number> {
    if (item.medicineId != null) {
      const existing = await tx.medicine.findUnique({
        where: { id: item.medicineId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException(
          i18nException('visits.errors.medicineNotFound'),
        );
      }
      return existing.id;
    }

    const name = item.name?.trim() ?? '';
    const nameKey = normalizeMedicineName(name);
    const medicine = await tx.medicine.upsert({
      where: { nameKey },
      create: {
        name,
        nameKey,
        strength: item.strength ?? null,
        form: item.form ?? null,
      },
      update: {},
      select: { id: true },
    });
    return medicine.id;
  }

  private reportData(
    visit: Visit,
    dto: CreateMedicalReportDto,
  ): Prisma.MedicalReportCreateInput {
    return {
      reportType: dto.reportType,
      title: dto.title,
      fileUrl: dto.fileUrl,
      reportDate:
        dto.reportDate === undefined ? null : toDateOnly(dto.reportDate),
      patient: { connect: { id: visit.patientId } },
      visit: { connect: { id: visit.id } },
    };
  }

  private async linkAppointment(
    tx: Tx,
    appointmentId: number,
    patientId: number,
    doctorId: number,
  ): Promise<void> {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        i18nException('visits.errors.appointmentNotFound'),
      );
    }
    if (appointment.patientId !== patientId) {
      throw new BadRequestException(
        i18nException('visits.errors.appointmentPatientMismatch'),
      );
    }
    if (!LINKABLE_APPOINTMENT_STATUSES.includes(appointment.status)) {
      throw new BadRequestException(
        i18nException('visits.errors.appointmentNotLinkable'),
      );
    }
    if (appointment.doctorId !== null && appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        i18nException('visits.errors.appointmentDoctorMismatch'),
      );
    }

    const existingVisit = await tx.visit.findUnique({
      where: { appointmentId },
      select: { id: true },
    });
    if (existingVisit) {
      throw new ConflictException(
        i18nException('visits.errors.appointmentAlreadyLinked'),
      );
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: this.appointmentLinkData(appointment, doctorId),
    });
  }

  private appointmentLinkData(
    appointment: Appointment,
    doctorId: number,
  ): Prisma.AppointmentUpdateInput {
    const data: Prisma.AppointmentUpdateInput = {};
    if (appointment.doctorId === null) {
      data.doctor = { connect: { id: doctorId } };
    }
    if (
      appointment.status === AppointmentStatus.SCHEDULED ||
      appointment.status === AppointmentStatus.CONFIRMED
    ) {
      data.status = AppointmentStatus.COMPLETED;
    }
    return data;
  }

  private async assertPatientExists(patientId: number): Promise<void> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(
        i18nException('visits.errors.patientNotFound'),
      );
    }
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
      throw new ForbiddenException(i18nException('visits.errors.forbidden'));
    }

    return { isPatient, isDoctor };
  }

  private accessWhere(
    userId: number,
    caller: CallerContext,
  ): Prisma.VisitWhereInput {
    if (caller.isPatient && !caller.isDoctor) {
      return { patientId: userId };
    }
    if (caller.isDoctor && !caller.isPatient) {
      return { doctorId: userId };
    }
    return {
      OR: [{ patientId: userId }, { doctorId: userId }],
    };
  }

  private listFilters(query: QueryVisitDto): Prisma.VisitWhereInput {
    const filters: Prisma.VisitWhereInput = {};
    if (query.status !== undefined) {
      filters.status = query.status;
    }
    if (query.patientId !== undefined) {
      filters.patientId = query.patientId;
    }
    return filters;
  }

  private async requireAccessible(user: User, id: number): Promise<Visit> {
    const caller = await this.resolveCaller(user.id);
    const row = await this.prisma.visit.findFirst({
      where: {
        id,
        AND: [this.accessWhere(user.id, caller)],
      },
    });
    if (!row) {
      throw new NotFoundException(i18nException('visits.errors.notFound'));
    }
    return row;
  }

  private async requireConductingDoctor(
    user: User,
    id: number,
  ): Promise<Visit> {
    const caller = await this.resolveCaller(user.id);
    if (!caller.isDoctor) {
      throw new ForbiddenException(i18nException('visits.errors.doctorOnly'));
    }

    const row = await this.prisma.visit.findFirst({
      where: {
        id,
        AND: [this.accessWhere(user.id, caller)],
      },
    });
    if (!row) {
      throw new NotFoundException(i18nException('visits.errors.notFound'));
    }
    if (row.doctorId !== user.id) {
      throw new ForbiddenException(i18nException('visits.errors.forbidden'));
    }
    return row;
  }

  private async requireOpenVisit(user: User, id: number): Promise<Visit> {
    const row = await this.requireConductingDoctor(user, id);
    if (row.status !== VisitStatus.OPEN) {
      throw new BadRequestException(i18nException('visits.errors.visitClosed'));
    }
    return row;
  }

  private toSummary(row: Visit): VisitDto {
    return {
      id: row.id,
      patientId: row.patientId,
      doctorId: row.doctorId,
      appointmentId: row.appointmentId,
      visitedAt: row.visitedAt.toISOString(),
      type: row.type,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDetail(row: VisitDetailRecord): VisitDetailDto {
    return {
      ...this.toSummary(row),
      diagnoses: row.diagnoses.map((item) => this.toVisitDiagnosis(item)),
      vitals: row.vitals.map((item) => this.toVital(item)),
      prescriptions: row.prescriptions.map((item) => this.toPrescription(item)),
      reports: row.reports.map((item) => this.toReport(item)),
      notes: row.notes.map((item) => this.toNote(item)),
      followUps: row.followUps.map((item) => this.toFollowUp(item)),
    };
  }

  private toDiagnosis(row: Diagnosis): DiagnosisDto {
    return {
      id: row.id,
      patientId: row.patientId,
      name: row.name,
      code: row.code,
      type: row.type,
      status: row.status,
      severity: row.severity,
      diagnosedOn: formatDateOnly(row.diagnosedOn),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toVisitDiagnosis(row: VisitDiagnosisRecord): VisitDiagnosisDto {
    return {
      id: row.id,
      visitId: row.visitId,
      diagnosisId: row.diagnosisId,
      notes: row.notes,
      isPrimary: row.isPrimary,
      diagnosis: this.toDiagnosis(row.diagnosis),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toVital(row: VisitVital): VisitVitalDto {
    return {
      id: row.id,
      visitId: row.visitId,
      type: row.type,
      value: row.value,
      unit: row.unit,
      recordedAt: row.recordedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toMedicine(row: Medicine): MedicineDto {
    return {
      id: row.id,
      name: row.name,
      strength: row.strength,
      form: row.form,
    };
  }

  private toPrescriptionItem(row: PrescriptionItemRecord): PrescriptionItemDto {
    return {
      id: row.id,
      prescriptionId: row.prescriptionId,
      medicineId: row.medicineId,
      dosage: row.dosage,
      frequency: row.frequency,
      duration: row.duration,
      instructions: row.instructions,
      startDate: row.startDate ? formatDateOnly(row.startDate) : null,
      endDate: row.endDate ? formatDateOnly(row.endDate) : null,
      medicine: this.toMedicine(row.medicine),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPrescription(row: PrescriptionRecord): PrescriptionDto {
    return {
      id: row.id,
      visitId: row.visitId,
      patientId: row.patientId,
      prescribedById: row.prescribedById,
      prescribedAt: row.prescribedAt.toISOString(),
      notes: row.notes,
      status: row.status,
      items: row.items.map((item) => this.toPrescriptionItem(item)),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toReport(row: MedicalReport): MedicalReportDto {
    return {
      id: row.id,
      patientId: row.patientId,
      visitId: row.visitId,
      reportType: row.reportType,
      title: row.title,
      fileUrl: row.fileUrl,
      reportDate: row.reportDate ? formatDateOnly(row.reportDate) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toNote(row: VisitNote): VisitNoteDto {
    return {
      id: row.id,
      visitId: row.visitId,
      noteType: row.noteType,
      content: row.content,
      authorId: row.authorId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toFollowUp(row: VisitFollowUp): VisitFollowUpDto {
    return {
      id: row.id,
      visitId: row.visitId,
      recommendedDate: row.recommendedDate.toISOString(),
      instructions: row.instructions,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

function normalizeMedicineName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
