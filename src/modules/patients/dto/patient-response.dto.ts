import { ApiProperty } from '@nestjs/swagger';
import { DataResponseDto } from '../../../common/dto/api-response.dto.js';
import { Gender } from '../../../generated/prisma/client.js';

export class PhoneResponseDto {
  @ApiProperty({ example: '91' })
  countryCode: string;

  @ApiProperty({ example: '9876543210' })
  phoneNumber: string;
}

export class EmergencyContactResponseDto {
  @ApiProperty({ example: 'Ravi Sharma' })
  name: string;

  @ApiProperty({ example: 'Spouse' })
  relationship: string;

  @ApiProperty({ type: PhoneResponseDto })
  phone: PhoneResponseDto;

  @ApiProperty({ type: PhoneResponseDto, nullable: true })
  alternatePhone: PhoneResponseDto | null;
}

export class PatientDto {
  @ApiProperty({ example: 'Priya Sharma', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: 'priya@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '91', nullable: true })
  countryCode: string | null;

  @ApiProperty({ example: '9876543210', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'en' })
  preferredLanguage: string;

  @ApiProperty({ example: '1990-05-15', nullable: true })
  dateOfBirth: string | null;

  @ApiProperty({ example: 35, nullable: true })
  age: number | null;

  @ApiProperty({ enum: Gender, nullable: true, example: Gender.FEMALE })
  gender: Gender | null;

  @ApiProperty({
    example: 'https://cdn.example.com/photos/priya.jpg',
    nullable: true,
  })
  profilePhotoUrl: string | null;

  @ApiProperty({ example: 'O+', nullable: true })
  bloodGroup: string | null;

  @ApiProperty({ type: EmergencyContactResponseDto, nullable: true })
  emergencyContact: EmergencyContactResponseDto | null;
}

export class PatientResponseDto extends DataResponseDto<PatientDto> {
  @ApiProperty({ type: PatientDto })
  declare data: PatientDto;
}
