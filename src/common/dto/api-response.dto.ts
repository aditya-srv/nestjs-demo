export class PaginationMetaDto {
  page: number;
  pageSize: number;
  total: number;
}

/** Single-resource envelope: `{ data: T }` or `{ data: null }`. Extend at module level. */
export class DataResponseDto<T> {
  data: T;
}

/** List envelope: `{ data: T[], meta }`. Extend at module level. */
export class ListResponseDto<T> {
  data: T[];
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
