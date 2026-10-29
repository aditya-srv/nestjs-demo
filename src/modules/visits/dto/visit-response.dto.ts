import {
  DataResponseDto,
  ListResponseDto,
} from '../../../common/dto/api-response.dto.js';
import type {
  DiagnosisSeverity,
  DiagnosisStatus,
  DiagnosisType,
  FollowUpStatus,
  PrescriptionStatus,
  ReportType,
  VisitNoteType,
  VisitStatus,
  VisitType,
  VitalType,
} from '../../../generated/prisma/client.js';

export class VisitDto {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentId: number | null;
  visitedAt: string;
  type: VisitType;
  reason: string | null;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export class DiagnosisDto {
  id: number;
  patientId: number;
  name: string;
  code: string | null;
  type: DiagnosisType;
  status: DiagnosisStatus;
  severity: DiagnosisSeverity | null;
  diagnosedOn: string;
  createdAt: string;
  updatedAt: string;
}

export class VisitDiagnosisDto {
  id: number;
  visitId: number;
  diagnosisId: number;
  notes: string | null;
  isPrimary: boolean;
  diagnosis: DiagnosisDto;
  createdAt: string;
  updatedAt: string;
}

export class VisitVitalDto {
  id: number;
  visitId: number;
  type: VitalType;
  value: string;
  unit: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class MedicineDto {
  id: number;
  name: string;
  strength: string | null;
  form: string | null;
}

export class PrescriptionItemDto {
  id: number;
  prescriptionId: number;
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  startDate: string | null;
  endDate: string | null;
  medicine: MedicineDto;
  createdAt: string;
  updatedAt: string;
}

export class PrescriptionDto {
  id: number;
  visitId: number;
  patientId: number;
  prescribedById: number;
  prescribedAt: string;
  notes: string | null;
  status: PrescriptionStatus;
  items: PrescriptionItemDto[];
  createdAt: string;
  updatedAt: string;
}

export class MedicalReportDto {
  id: number;
  patientId: number;
  visitId: number | null;
  reportType: ReportType;
  title: string;
  fileUrl: string;
  reportDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export class VisitNoteDto {
  id: number;
  visitId: number;
  noteType: VisitNoteType;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export class VisitFollowUpDto {
  id: number;
  visitId: number;
  recommendedDate: string;
  instructions: string | null;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export class VisitDetailDto extends VisitDto {
  diagnoses: VisitDiagnosisDto[];
  vitals: VisitVitalDto[];
  prescriptions: PrescriptionDto[];
  reports: MedicalReportDto[];
  notes: VisitNoteDto[];
  followUps: VisitFollowUpDto[];
}

export class VisitResponseDto extends DataResponseDto<VisitDetailDto> {
  declare data: VisitDetailDto;
}

export class VisitListResponseDto extends ListResponseDto<VisitDto> {
  declare data: VisitDto[];
}

export class VisitDiagnosisResponseDto extends DataResponseDto<VisitDiagnosisDto> {
  declare data: VisitDiagnosisDto;
}

export class VisitVitalResponseDto extends DataResponseDto<VisitVitalDto> {
  declare data: VisitVitalDto;
}

export class VisitNoteResponseDto extends DataResponseDto<VisitNoteDto> {
  declare data: VisitNoteDto;
}

export class VisitFollowUpResponseDto extends DataResponseDto<VisitFollowUpDto> {
  declare data: VisitFollowUpDto;
}

export class PrescriptionResponseDto extends DataResponseDto<PrescriptionDto> {
  declare data: PrescriptionDto;
}

export class MedicalReportResponseDto extends DataResponseDto<MedicalReportDto> {
  declare data: MedicalReportDto;
}
