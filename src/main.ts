import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './common/utils/configure-app.js';
import { setupSwagger } from './common/utils/setup-swagger.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DoctorsModule } from './modules/doctors/doctors.module.js';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { PatientsModule } from './modules/patients/patients.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app, {
    include: [AuthModule, OnboardingModule, PatientsModule, DoctorsModule],
  });
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('app.port'));
}

await bootstrap();
