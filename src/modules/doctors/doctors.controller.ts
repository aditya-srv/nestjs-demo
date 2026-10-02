import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DoctorsService } from './doctors.service.js';
import type { DoctorResponseDto } from './dto/doctor-response.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'doctors', version: API_DEFAULT_VERSION })
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): Promise<DoctorResponseDto> {
    return this.doctorsService.getMe(user);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    return this.doctorsService.updateMe(user, dto);
  }
}
