import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchUsersQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q: string;

  @IsOptional()
  limit?: number;
}
