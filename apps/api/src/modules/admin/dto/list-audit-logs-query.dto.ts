import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class ListAuditLogsQueryDto extends PaginationQueryDto {
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
  @IsUUID()
  tenantId?: string;

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
