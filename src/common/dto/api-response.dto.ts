import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 0 })
  total: number;
}

/** Single-resource envelope: `{ data: T }` or `{ data: null }`. Extend at module level. */
export class DataResponseDto<T> {
  @ApiProperty()
  data: T;
}

/** List envelope: `{ data: T[], meta }`. Extend at module level. */
export class ListResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export function toDataResponse<T>(data: T): { data: T } {
  return { data };
}

export function toListResponse<T>(
  data: T[],
  meta: PaginationMetaDto,
): { data: T[]; meta: PaginationMetaDto } {
  return { data, meta };
}
