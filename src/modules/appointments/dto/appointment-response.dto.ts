import {
  DataResponseDto,
  ListResponseDto,
} from '../../../common/dto/api-response.dto.js';
import type {
  AppointmentStatus,
  AppointmentType,
} from '../../../generated/prisma/client.js';

export class AppointmentDto {
  id: number;
  patientId: number;
  doctorId: number | null;
  createdByUserId: number;
  appointmentAt: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class AppointmentResponseDto extends DataResponseDto<AppointmentDto> {
  declare data: AppointmentDto;
}

export class AppointmentListResponseDto extends ListResponseDto<AppointmentDto> {
  declare data: AppointmentDto[];
}
