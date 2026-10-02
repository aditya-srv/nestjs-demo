import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PatientsModule } from '../patients/patients.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';

@Module({
  imports: [AuthModule, PatientsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
