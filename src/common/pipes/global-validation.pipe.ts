import { I18nValidationPipe } from 'nestjs-i18n';

export const globalValidationPipe = new I18nValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
