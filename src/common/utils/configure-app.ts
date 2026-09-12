import { INestApplication, VersioningType } from '@nestjs/common';

export const API_DEFAULT_VERSION = '1';

export function configureApp<T extends INestApplication>(app: T): T {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });

  return app;
}
