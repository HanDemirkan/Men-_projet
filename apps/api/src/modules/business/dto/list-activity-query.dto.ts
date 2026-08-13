import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

// No `tenantId` field, unlike the admin module's equivalent DTO - this
// endpoint is always implicitly scoped to the caller's own tenant (see
// BusinessActivityService), never an arbitrary one from the request.
export class ListActivityQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Actor - eylemi yapan kullanıcının id'si" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  requestId?: string;

  @ApiPropertyOptional({ description: "ISO tarih - bu tarihten itibaren" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: "ISO tarih - bu tarihe kadar" })
  @IsOptional()
  @IsDateString()
  to?: string;
}
