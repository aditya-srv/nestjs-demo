import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '../../../generated/i18n.generated.js';
import {
  DiagnosisStatus,
  DiagnosisType,
  DiagnosisSeverity,
  ReportType,
  VisitNoteType,
  VisitType,
  VitalType,
} from '../../../generated/prisma/client.js';

function isNewDiagnosis(dto: CreateVisitDiagnosisDto): boolean {
  return dto.diagnosisId == null;
}

function isNewMedicine(dto: CreatePrescriptionItemDto): boolean {
  return dto.medicineId == null;
}

export class CreateVisitDiagnosisDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  diagnosisId?: number;

  @ValidateIf(isNewDiagnosis)
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  name?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  code?: string;

  @ValidateIf(isNewDiagnosis)
  @IsEnum(DiagnosisType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type?: DiagnosisType;

  @ValidateIf(isNewDiagnosis)
  @IsEnum(DiagnosisStatus, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  status?: DiagnosisStatus;

  @IsOptional()
  @IsEnum(DiagnosisSeverity, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  severity?: DiagnosisSeverity;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  diagnosedOn?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  notes?: string;

  @IsOptional()
  @IsBoolean({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_BOOLEAN'),
  })
  isPrimary?: boolean;
}

export class CreateVisitVitalDto {
  @IsEnum(VitalType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type: VitalType;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  value: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  unit?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  recordedAt?: string;
}

export class CreateVisitNoteDto {
  @IsEnum(VisitNoteType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  noteType: VisitNoteType;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  content: string;
}

export class CreateVisitFollowUpDto {
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  recommendedDate: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  instructions?: string;
}

export class CreatePrescriptionItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  medicineId?: number;

  @ValidateIf(isNewMedicine)
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  name?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  strength?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  form?: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  dosage: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  frequency: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  duration: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  instructions?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  startDate?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  endDate?: string;
}

export class CreatePrescriptionDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  notes?: string;

  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ArrayMinSize(1, {
    message: i18nValidationMessage<I18nTranslations>(
      'validation.ARRAY_NOT_EMPTY',
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}

export class CreateMedicalReportDto {
  @IsEnum(ReportType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  reportType: ReportType;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  title: string;

  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  fileUrl: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  reportDate?: string;
}

export class CreateVisitDto {
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  patientId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_INT'),
  })
  appointmentId?: number;

  @IsISO8601(
    { strict: true },
    {
      message: i18nValidationMessage<I18nTranslations>('validation.IS_ISO8601'),
    },
  )
  visitedAt: string;

  @IsEnum(VisitType, {
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM'),
  })
  type: VisitType;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_NOT_EMPTY'),
  })
  reason?: string;

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateVisitDiagnosisDto)
  diagnoses?: CreateVisitDiagnosisDto[];

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateVisitVitalDto)
  vitals?: CreateVisitVitalDto[];

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateVisitNoteDto)
  notes?: CreateVisitNoteDto[];

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateVisitFollowUpDto)
  followUps?: CreateVisitFollowUpDto[];

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[];

  @IsOptional()
  @IsArray({
    message: i18nValidationMessage<I18nTranslations>('validation.IS_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateMedicalReportDto)
  reports?: CreateMedicalReportDto[];
}
