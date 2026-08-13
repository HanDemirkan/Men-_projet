import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

// Shared by every list query DTO across the API (admin module, business
// module, ...). No pagination convention existed anywhere in the codebase
// before Sprint 4 - list endpoints return `{ items, page, pageSize, total,
// totalPages }` as the response `data` itself, since the global
// ResponseInterceptor's `meta` is hardcoded null and changing that would
// affect every existing endpoint in the app.
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
