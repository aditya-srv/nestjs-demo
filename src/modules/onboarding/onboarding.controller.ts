import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
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
import { EmergencyContactDto } from '../patients/dto/emergency-contact.dto.js';
import { OnboardingResponseDto } from './dto/onboarding-response.dto.js';
import { SaveAllergiesDto } from './dto/save-allergies.dto.js';
import { SaveBasicDetailsDto } from './dto/save-basic-details.dto.js';
import { SaveMedicalHistoryDto } from './dto/save-medical-history.dto.js';
import { OnboardingService } from './onboarding.service.js';

@ApiTags('onboarding')
@ApiBearerAuth()
@ApiExtraModels(ValidationErrorDto, HttpErrorDto)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'onboarding', version: API_DEFAULT_VERSION })
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current onboarding draft and status' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  get(@CurrentUser() user: User): Promise<OnboardingResponseDto> {
    return this.onboardingService.get(user);
  }

  @Patch('basic-details')
  @ApiOperation({ summary: 'Save basic details step' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Email already taken, or onboarding already completed',
  })
  saveBasicDetails(
    @CurrentUser() user: User,
    @Body() dto: SaveBasicDetailsDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveBasicDetails(user, dto);
  }

  @Patch('emergency-contact')
  @ApiOperation({ summary: 'Save emergency contact step' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Onboarding already completed',
  })
  saveEmergencyContact(
    @CurrentUser() user: User,
    @Body() dto: EmergencyContactDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveEmergencyContact(user, dto);
  }

  @Patch('medical-history')
  @ApiOperation({ summary: 'Save medical history step' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Onboarding already completed',
  })
  saveMedicalHistory(
    @CurrentUser() user: User,
    @Body() dto: SaveMedicalHistoryDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveMedicalHistory(user, dto);
  }

  @Patch('allergies')
  @ApiOperation({ summary: 'Save allergies step' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Onboarding already completed',
  })
  saveAllergies(
    @CurrentUser() user: User,
    @Body() dto: SaveAllergiesDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveAllergies(user, dto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete onboarding and assign PATIENT role' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiBadRequestResponse({
    type: HttpErrorDto,
    description: 'Required onboarding steps are incomplete',
  })
  @ApiUnauthorizedResponse({ type: HttpErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Onboarding already completed',
  })
  complete(@CurrentUser() user: User): Promise<OnboardingResponseDto> {
    return this.onboardingService.complete(user);
  }
}
