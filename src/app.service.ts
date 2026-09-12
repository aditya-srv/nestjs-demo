import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { I18nTranslations } from './generated/i18n.generated.js';

@Injectable()
export class AppService {
  constructor(private readonly i18n: I18nService<I18nTranslations>) {}

  getHello(): string {
    return this.i18n.t('common.hello');
  }
}
