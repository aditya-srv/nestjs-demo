import type { INestApplication, Type } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export type SetupSwaggerOptions = {
  include: Type<unknown>[];
};

export function setupSwagger(
  app: INestApplication,
  options: SetupSwaggerOptions,
): void {
  const config = new DocumentBuilder()
    .setTitle('serviRx API')
    .setDescription('HTTP API documentation')
    .setVersion('1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: options.include,
  });

  SwaggerModule.setup('docs', app, document);
}
