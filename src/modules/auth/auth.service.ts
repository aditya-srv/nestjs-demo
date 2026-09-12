import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import {
  i18nException,
  type I18nExceptionArgs,
} from '../../common/utils/i18n-exception.js';
import type { I18nPath } from '../../generated/i18n.generated.js';
import { Prisma, type User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AuthResponseDto,
  AuthUserResponseDto,
  OtpRequestedResponseDto,
} from './dto/auth-response.dto.js';
import type { PhoneDto, VerifyPhoneDto } from './dto/phone.dto.js';
import {
  BLOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  OTP_LENGTH,
  OTP_TTL_MS,
  RESEND_AVAILABLE_IN_SECONDS,
  RESEND_COOLDOWN_MS,
} from './otp.constants.js';
import { OTP_SENDER, type OtpSender } from './otp-sender.js';

type PhoneIdentity = {
  countryCode: string;
  phoneNumber: string;
};

type AuthUser = User & {
  onboarding?: { completed: boolean } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(OTP_SENDER) private readonly otpSender: OtpSender,
  ) {}

  async requestRegisterOtp(dto: PhoneDto): Promise<OtpRequestedResponseDto> {
    const phone = this.phoneIdentity(dto);
    await this.assertPhoneAvailable(phone);
    return this.requestOtp(phone);
  }

  async requestLoginOtp(dto: PhoneDto): Promise<OtpRequestedResponseDto> {
    const phone = this.phoneIdentity(dto);
    await this.requireRegisteredUser(phone);
    return this.requestOtp(phone);
  }

  async verifyRegisterOtp(dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    const phone = this.phoneIdentity(dto);
    await this.assertPhoneAvailable(phone);
    const otp = await this.requireValidOtp(phone, dto.otp);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: phone,
        });
        await tx.phoneOtp.delete({ where: { id: otp.id } });
        return created;
      });

      return this.toAuthResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(i18nException('auth.errors.phoneTaken'));
      }
      throw error;
    }
  }

  async verifyLoginOtp(dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    const phone = this.phoneIdentity(dto);
    const user = await this.requireRegisteredUser(phone);
    const otp = await this.requireValidOtp(phone, dto.otp);

    await this.prisma.phoneOtp.delete({ where: { id: otp.id } });

    return this.toAuthResponse(user);
  }

  private async requestOtp(
    phone: PhoneIdentity,
  ): Promise<OtpRequestedResponseDto> {
    const now = new Date();
    const existing = await this.prisma.phoneOtp.findUnique({
      where: { countryCode_phoneNumber: phone },
    });

    this.assertNotBlocked(existing?.blockedUntil, now);

    if (existing) {
      const cooldownSeconds = this.remainingCooldownSeconds(
        existing.lastSentAt,
        now,
      );
      if (cooldownSeconds > 0) {
        this.throwTooMany('auth.errors.otpCooldown', {
          seconds: cooldownSeconds,
        });
      }
    }

    const resetFailures =
      existing?.blockedUntil != null && existing.blockedUntil <= now;
    const code = this.generateOtp();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    await this.prisma.phoneOtp.upsert({
      where: { countryCode_phoneNumber: phone },
      create: {
        ...phone,
        codeHash: this.hashOtp(code),
        expiresAt,
        lastSentAt: now,
        failedAttempts: 0,
        blockedUntil: null,
      },
      update: {
        codeHash: this.hashOtp(code),
        expiresAt,
        lastSentAt: now,
        ...(resetFailures ? { failedAttempts: 0, blockedUntil: null } : {}),
      },
    });

    await this.otpSender.send(phone.countryCode, phone.phoneNumber, code);

    return {
      ...phone,
      resendAvailableInSeconds: RESEND_AVAILABLE_IN_SECONDS,
    };
  }

  private async requireValidOtp(
    phone: PhoneIdentity,
    otp: string,
  ): Promise<{ id: number }> {
    const now = new Date();
    const existing = await this.prisma.phoneOtp.findUnique({
      where: { countryCode_phoneNumber: phone },
    });

    if (!existing) {
      throw new BadRequestException(
        i18nException('auth.errors.otpNotRequested'),
      );
    }

    this.assertNotBlocked(existing.blockedUntil, now);

    if (existing.expiresAt <= now || !this.otpMatches(existing.codeHash, otp)) {
      await this.recordFailedAttempt(existing.id, existing.failedAttempts, now);
    }

    return existing;
  }

  private phoneIdentity(dto: PhoneIdentity): PhoneIdentity {
    return {
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
    };
  }

  private async assertPhoneAvailable(phone: PhoneIdentity): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { countryCode_phoneNumber: phone },
    });

    if (user) {
      throw new ConflictException(i18nException('auth.errors.phoneTaken'));
    }
  }

  private async requireRegisteredUser(phone: PhoneIdentity): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { countryCode_phoneNumber: phone },
      include: { onboarding: { select: { completed: true } } },
    });

    if (!user) {
      throw new NotFoundException(
        i18nException('auth.errors.phoneNotRegistered'),
      );
    }

    return user;
  }

  private assertNotBlocked(
    blockedUntil: Date | null | undefined,
    now: Date,
  ): void {
    if (blockedUntil && blockedUntil > now) {
      this.throwTooMany('auth.errors.otpBlocked', {
        minutes: this.remainingBlockMinutes(blockedUntil, now),
      });
    }
  }

  private async recordFailedAttempt(
    id: number,
    currentFailedAttempts: number,
    now: Date,
  ): Promise<never> {
    const failedAttempts = currentFailedAttempts + 1;
    const blockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + BLOCK_DURATION_MS)
        : undefined;

    await this.prisma.phoneOtp.update({
      where: { id },
      data: {
        failedAttempts,
        ...(blockedUntil ? { blockedUntil } : {}),
      },
    });

    if (blockedUntil) {
      this.throwTooMany('auth.errors.otpBlocked', {
        minutes: this.remainingBlockMinutes(blockedUntil, now),
      });
    }

    throw new BadRequestException(i18nException('auth.errors.otpInvalid'));
  }

  private throwTooMany(key: I18nPath, args: I18nExceptionArgs): never {
    throw new HttpException(
      i18nException(key, args),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private remainingCooldownSeconds(lastSentAt: Date, now: Date): number {
    const remainingMs =
      RESEND_COOLDOWN_MS - (now.getTime() - lastSentAt.getTime());
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  private remainingBlockMinutes(blockedUntil: Date, now: Date): number {
    return Math.max(
      1,
      Math.ceil((blockedUntil.getTime() - now.getTime()) / 60_000),
    );
  }

  private generateOtp(): string {
    return randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
  }

  private hashOtp(code: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('jwt.secret'))
      .update(code)
      .digest('hex');
  }

  private otpMatches(codeHash: string, code: string): boolean {
    const expected = Buffer.from(codeHash, 'hex');
    const actual = Buffer.from(this.hashOtp(code), 'hex');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private toAuthResponse(user: AuthUser): AuthResponseDto {
    return {
      accessToken: this.jwt.sign({ sub: user.id }),
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(row: AuthUser): AuthUserResponseDto {
    return {
      id: row.id,
      countryCode: row.countryCode,
      phoneNumber: row.phoneNumber,
      email: row.email,
      name: row.name,
      role: row.role,
      preferredLanguage: row.preferredLanguage,
      onboardingCompleted: row.onboarding?.completed ?? false,
    };
  }
}
