import { ApiProperty } from '@nestjs/swagger';
import { DataResponseDto } from '../../../common/dto/api-response.dto.js';

export class DoctorDto {
  @ApiProperty({ example: 'Dr. Anita Mehta', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: 'anita@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '91', nullable: true })
  countryCode: string | null;

  @ApiProperty({ example: '9876543210', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'en' })
  preferredLanguage: string;

  @ApiProperty({ example: 'Cardiology', nullable: true })
  specialization: string | null;
}

export class DoctorResponseDto extends DataResponseDto<DoctorDto> {
  @ApiProperty({ type: DoctorDto })
  declare data: DoctorDto;
}
