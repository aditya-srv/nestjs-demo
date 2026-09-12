import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config.js';
import { databaseConfig } from './database.config.js';
import { envSchema } from './env.schema.js';
import { jwtConfig } from './jwt.config.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env'],
      validationSchema: envSchema,
      load: [appConfig, jwtConfig, databaseConfig],
    }),
  ],
})
export class ConfigModule {}
