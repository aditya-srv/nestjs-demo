import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoggingOtpSender, OTP_SENDER } from './otp-sender.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    {
      provide: OTP_SENDER,
      useClass: LoggingOtpSender,
    },
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
