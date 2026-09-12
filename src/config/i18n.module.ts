import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  I18nModule as NestI18nModule,
} from 'nestjs-i18n';
import { ConfigModule } from './config.module.js';

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      resolvers: [AcceptLanguageResolver],
      useFactory: (config: ConfigService) => ({
        fallbackLanguage: config.getOrThrow<string>('app.fallbackLanguage'),
        throwOnMissingKey: config.get<string>('app.nodeEnv') === 'development',
        loaderOptions: {
          path: join(import.meta.dirname, '..', 'i18n'),
          watch: config.get<string>('app.nodeEnv') === 'development',
        },
        typesOutputPath: join(process.cwd(), 'src/generated/i18n.generated.ts'),
      }),
    }),
  ],
})
export class I18nConfigModule {}
