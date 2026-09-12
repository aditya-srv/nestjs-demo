import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { i18nException } from '../../../common/utils/i18n-exception.js';
import type { User } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

type AccessTokenPayload = {
  sub: number | string;
};

export type RequestWithUser = Request & {
  user?: User;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearer(request);

    if (!token) {
      this.deny();
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId < 1) {
        this.deny();
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.deny();
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.deny();
    }
  }

  private deny(): never {
    throw new UnauthorizedException(i18nException('auth.errors.unauthorized'));
  }

  private extractBearer(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) {
      return undefined;
    }

    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
  }
}
