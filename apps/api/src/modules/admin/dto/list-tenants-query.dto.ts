import { ApiPropertyOptional } from "@nestjs/swagger";
import { TenantStatus } from "@qr-platform/database";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const TENANT_SORT_FIELDS = ["name", "slug", "status", "createdAt"] as const;
export type TenantSortField = (typeof TENANT_SORT_FIELDS)[number];

export class ListTenantsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "İşletme adı veya slug içinde arar" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ enum: TENANT_SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsIn(TENANT_SORT_FIELDS)
  sortBy: TenantSortField = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
