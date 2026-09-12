import { Injectable, Logger } from '@nestjs/common';

export const OTP_SENDER = Symbol('OTP_SENDER');

export interface OtpSender {
  send(countryCode: string, phoneNumber: string, code: string): Promise<void>;
}

@Injectable()
export class LoggingOtpSender implements OtpSender {
  private readonly logger = new Logger(LoggingOtpSender.name);

  send(countryCode: string, phoneNumber: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${countryCode} ${phoneNumber}: ${code}`);
    return Promise.resolve();
  }
}
