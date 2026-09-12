import { Body, Controller, Post } from '@nestjs/common';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import { AuthService } from './auth.service.js';
import type {
  AuthResponseDto,
  OtpRequestedResponseDto,
} from './dto/auth-response.dto.js';
import {
  LoginPhoneDto,
  RegisterPhoneDto,
  VerifyPhoneDto,
} from './dto/phone.dto.js';

@Controller({ path: 'auth', version: API_DEFAULT_VERSION })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/phone')
  requestRegisterOtp(
    @Body() dto: RegisterPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestRegisterOtp(dto);
  }

  @Post('register/phone/resend')
  resendRegisterOtp(
    @Body() dto: RegisterPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestRegisterOtp(dto);
  }

  @Post('register/phone/verify')
  verifyRegisterOtp(@Body() dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    return this.authService.verifyRegisterOtp(dto);
  }

  @Post('login/phone')
  requestLoginOtp(
    @Body() dto: LoginPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestLoginOtp(dto);
  }

  @Post('login/phone/resend')
  resendLoginOtp(
    @Body() dto: LoginPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestLoginOtp(dto);
  }

  @Post('login/phone/verify')
  verifyLoginOtp(@Body() dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    return this.authService.verifyLoginOtp(dto);
  }
}
