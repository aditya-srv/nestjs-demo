import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { i18nValidationExceptionFilter } from './common/filters/i18n-validation-exception.filter.js';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter.js';
import { globalValidationPipe } from './common/pipes/global-validation.pipe.js';
import { ConfigModule } from './config/config.module.js';
import { I18nConfigModule } from './config/i18n.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtConfigModule } from './modules/auth/jwt.module.js';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule,
    I18nConfigModule,
    JwtConfigModule,
    PrismaModule,
    AuthModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: globalValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useValue: i18nValidationExceptionFilter,
    },
  ],
})
export class AppModule {}
