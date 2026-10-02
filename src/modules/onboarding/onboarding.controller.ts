import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EmergencyContactDto } from '../patients/dto/emergency-contact.dto.js';
import type { OnboardingResponseDto } from './dto/onboarding-response.dto.js';
import { SaveAllergiesDto } from './dto/save-allergies.dto.js';
import { SaveBasicDetailsDto } from './dto/save-basic-details.dto.js';
import { SaveMedicalHistoryDto } from './dto/save-medical-history.dto.js';
import { OnboardingService } from './onboarding.service.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'onboarding', version: API_DEFAULT_VERSION })
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  get(@CurrentUser() user: User): Promise<OnboardingResponseDto> {
    return this.onboardingService.get(user);
  }

  @Patch('basic-details')
  saveBasicDetails(
    @CurrentUser() user: User,
    @Body() dto: SaveBasicDetailsDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveBasicDetails(user, dto);
  }

  @Patch('emergency-contact')
  saveEmergencyContact(
    @CurrentUser() user: User,
    @Body() dto: EmergencyContactDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveEmergencyContact(user, dto);
  }

  @Patch('medical-history')
  saveMedicalHistory(
    @CurrentUser() user: User,
    @Body() dto: SaveMedicalHistoryDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveMedicalHistory(user, dto);
  }

  @Patch('allergies')
  saveAllergies(
    @CurrentUser() user: User,
    @Body() dto: SaveAllergiesDto,
  ): Promise<OnboardingResponseDto> {
    return this.onboardingService.saveAllergies(user, dto);
  }

  @Post('complete')
  complete(@CurrentUser() user: User): Promise<OnboardingResponseDto> {
    return this.onboardingService.complete(user);
  }
}
