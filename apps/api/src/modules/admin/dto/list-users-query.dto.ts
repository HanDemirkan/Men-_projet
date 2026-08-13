import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserStatus } from "@qr-platform/database";
import { ROLE_VALUES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const USER_SORT_FIELDS = ["name", "email", "lastLoginAt", "createdAt"] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Ad, soyad veya e-posta içinde arar" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @ApiPropertyOptional({ enum: ROLE_VALUES, description: "En az bir üyeliği bu role sahip kullanıcılar" })
  @IsOptional()
  @IsIn(ROLE_VALUES)
  role?: Role;

  @ApiPropertyOptional({ description: "En az bir üyeliği bu işletmeye ait kullanıcılar" })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy: UserSortField = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
