import { DataResponseDto } from '../../../common/dto/api-response.dto.js';

export class DoctorDto {
  fullName: string | null;
  email: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  specialization: string | null;
}

export class DoctorResponseDto extends DataResponseDto<DoctorDto> {
  declare data: DoctorDto;
}
