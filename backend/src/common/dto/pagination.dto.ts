import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;

  constructor(items: T[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
    this.hasMore = nextCursor !== null;
  }
}
