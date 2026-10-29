import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  HttpErrorDto,
  ValidationErrorDto,
} from '../../common/dto/api-error.dto.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import { AuthService } from './auth.service.js';
import {
  AuthResponseDto,
  OtpRequestedResponseDto,
} from './dto/auth-response.dto.js';
import {
  LoginPhoneDto,
  RegisterPhoneDto,
  VerifyPhoneDto,
} from './dto/phone.dto.js';

@ApiTags('auth')
@ApiExtraModels(ValidationErrorDto, HttpErrorDto)
@Controller({ path: 'auth', version: API_DEFAULT_VERSION })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/phone')
  @ApiOperation({ summary: 'Request OTP to register with phone' })
  @ApiOkResponse({ type: OtpRequestedResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Phone already registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP cooldown or blocked',
  })
  requestRegisterOtp(
    @Body() dto: RegisterPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestRegisterOtp(dto);
  }

  @Post('register/phone/resend')
  @ApiOperation({ summary: 'Resend registration OTP' })
  @ApiOkResponse({ type: OtpRequestedResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Phone already registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP cooldown or blocked',
  })
  resendRegisterOtp(
    @Body() dto: RegisterPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestRegisterOtp(dto);
  }

  @Post('register/phone/verify')
  @ApiOperation({ summary: 'Verify registration OTP and create session' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failure (message object), or otpInvalid / otpNotRequested (message string)',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorDto) },
        { $ref: getSchemaPath(HttpErrorDto) },
      ],
    },
  })
  @ApiConflictResponse({
    type: HttpErrorDto,
    description: 'Phone already registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP blocked after too many failures',
  })
  verifyRegisterOtp(@Body() dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    return this.authService.verifyRegisterOtp(dto);
  }

  @Post('login/phone')
  @ApiOperation({ summary: 'Request OTP to log in with phone' })
  @ApiOkResponse({ type: OtpRequestedResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiNotFoundResponse({
    type: HttpErrorDto,
    description: 'Phone not registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP cooldown or blocked',
  })
  requestLoginOtp(
    @Body() dto: LoginPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestLoginOtp(dto);
  }

  @Post('login/phone/resend')
  @ApiOperation({ summary: 'Resend login OTP' })
  @ApiOkResponse({ type: OtpRequestedResponseDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiNotFoundResponse({
    type: HttpErrorDto,
    description: 'Phone not registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP cooldown or blocked',
  })
  resendLoginOtp(
    @Body() dto: LoginPhoneDto,
  ): Promise<OtpRequestedResponseDto> {
    return this.authService.requestLoginOtp(dto);
  }

  @Post('login/phone/verify')
  @ApiOperation({ summary: 'Verify login OTP and create session' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failure (message object), or otpInvalid / otpNotRequested (message string)',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorDto) },
        { $ref: getSchemaPath(HttpErrorDto) },
      ],
    },
  })
  @ApiNotFoundResponse({
    type: HttpErrorDto,
    description: 'Phone not registered',
  })
  @ApiTooManyRequestsResponse({
    type: HttpErrorDto,
    description: 'OTP blocked after too many failures',
  })
  verifyLoginOtp(@Body() dto: VerifyPhoneDto): Promise<AuthResponseDto> {
    return this.authService.verifyLoginOtp(dto);
  }
}
