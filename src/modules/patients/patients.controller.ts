import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PatientResponseDto } from './dto/patient-response.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientsService } from './patients.service.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'patients', version: API_DEFAULT_VERSION })
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): Promise<PatientResponseDto> {
    return this.patientsService.getMe(user);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.updateMe(user, dto);
  }
}
