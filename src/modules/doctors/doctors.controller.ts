import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  HttpErrorDto,
  ValidationErrorDto,
} from '../../common/dto/api-error.dto.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DoctorsService } from './doctors.service.js';
import { DoctorResponseDto } from './dto/doctor-response.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@ApiTags('doctors')
@ApiBearerAuth()
@ApiExtraModels(ValidationErrorDto, HttpErrorDto)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'doctors', version: API_DEFAULT_VERSION })
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current doctor profile' })
  @ApiOkResponse({ type: DoctorResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  getMe(@CurrentUser() user: User): Promise<DoctorResponseDto> {
    return this.doctorsService.getMe(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current doctor profile' })
  @ApiOkResponse({ type: DoctorResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Email already taken',
  })
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    return this.doctorsService.updateMe(user, dto);
  }
}
