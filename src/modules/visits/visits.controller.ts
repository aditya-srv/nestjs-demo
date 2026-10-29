import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CreateMedicalReportDto,
  CreatePrescriptionDto,
  CreateVisitDiagnosisDto,
  CreateVisitDto,
  CreateVisitFollowUpDto,
  CreateVisitNoteDto,
  CreateVisitVitalDto,
} from './dto/create-visit.dto.js';
import { QueryVisitDto } from './dto/query-visit.dto.js';
import { UpdateVisitDto } from './dto/update-visit.dto.js';
import type {
  MedicalReportResponseDto,
  PrescriptionResponseDto,
  VisitDiagnosisResponseDto,
  VisitFollowUpResponseDto,
  VisitListResponseDto,
  VisitNoteResponseDto,
  VisitResponseDto,
  VisitVitalResponseDto,
} from './dto/visit-response.dto.js';
import { VisitsService } from './visits.service.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'visits', version: API_DEFAULT_VERSION })
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateVisitDto,
  ): Promise<VisitResponseDto> {
    return this.visitsService.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query() query: QueryVisitDto,
  ): Promise<VisitListResponseDto> {
    return this.visitsService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VisitResponseDto> {
    return this.visitsService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisitDto,
  ): Promise<VisitResponseDto> {
    return this.visitsService.update(user, id, dto);
  }

  @Post(':id/diagnoses')
  addDiagnosis(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVisitDiagnosisDto,
  ): Promise<VisitDiagnosisResponseDto> {
    return this.visitsService.addDiagnosis(user, id, dto);
  }

  @Post(':id/vitals')
  addVital(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVisitVitalDto,
  ): Promise<VisitVitalResponseDto> {
    return this.visitsService.addVital(user, id, dto);
  }

  @Post(':id/notes')
  addNote(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVisitNoteDto,
  ): Promise<VisitNoteResponseDto> {
    return this.visitsService.addNote(user, id, dto);
  }

  @Post(':id/follow-ups')
  addFollowUp(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVisitFollowUpDto,
  ): Promise<VisitFollowUpResponseDto> {
    return this.visitsService.addFollowUp(user, id, dto);
  }

  @Post(':id/prescriptions')
  addPrescription(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    return this.visitsService.addPrescription(user, id, dto);
  }

  @Post(':id/reports')
  addReport(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMedicalReportDto,
  ): Promise<MedicalReportResponseDto> {
    return this.visitsService.addReport(user, id, dto);
  }
}
