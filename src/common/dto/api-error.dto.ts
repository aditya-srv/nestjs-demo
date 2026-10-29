import { ApiProperty } from '@nestjs/swagger';

/** Validation failure body from `i18nValidationExceptionFilter`. */
export class ValidationErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    description: 'Field path → translated constraint messages',
    example: { phoneNumber: ['phoneNumber must be a valid phone number'] },
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  message: Record<string, string[]>;
}

/** Nest HTTP exception body after i18n translation. */
export class HttpErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 'This phone number is already registered' })
  message: string;
}
