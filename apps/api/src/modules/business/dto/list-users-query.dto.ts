import { ApiPropertyOptional } from "@nestjs/swagger";
import { TenantUserStatus } from "@qr-platform/database";
import { ROLE_VALUES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const BUSINESS_USER_SORT_FIELDS = ["name", "email", "lastLoginAt", "createdAt"] as const;
export type BusinessUserSortField = (typeof BUSINESS_USER_SORT_FIELDS)[number];

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Ad, soyad veya e-posta içinde arar" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @ApiPropertyOptional({ enum: ROLE_VALUES })
  @IsOptional()
  @IsIn(ROLE_VALUES)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: TenantUserStatus })
  @IsOptional()
  @IsEnum(TenantUserStatus)
  status?: TenantUserStatus;

  @ApiPropertyOptional({ enum: BUSINESS_USER_SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsIn(BUSINESS_USER_SORT_FIELDS)
  sortBy: BusinessUserSortField = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
