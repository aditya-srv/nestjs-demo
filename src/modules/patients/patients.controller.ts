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
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  HttpErrorDto,
  ValidationErrorDto,
} from '../../common/dto/api-error.dto.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PatientResponseDto } from './dto/patient-response.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientsService } from './patients.service.js';

@ApiTags('patients')
@ApiBearerAuth()
@ApiExtraModels(ValidationErrorDto, HttpErrorDto)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'patients', version: API_DEFAULT_VERSION })
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current patient profile' })
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  getMe(@CurrentUser() user: User): Promise<PatientResponseDto> {
    return this.patientsService.getMe(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiOkResponse({ type: PatientResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failure (message object), or invalid date of birth (message string)',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorDto) },
        { $ref: getSchemaPath(HttpErrorDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Email already taken, or onboarding incomplete',
  })
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.updateMe(user, dto);
  }
}
