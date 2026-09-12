import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service.js';
import { API_DEFAULT_VERSION } from './common/utils/configure-app.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller({ version: API_DEFAULT_VERSION })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Version(VERSION_NEUTRAL)
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
