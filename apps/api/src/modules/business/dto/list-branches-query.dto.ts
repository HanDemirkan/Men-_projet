import { ApiPropertyOptional } from "@nestjs/swagger";
import { BranchStatus } from "@qr-platform/database";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const BRANCH_SORT_FIELDS = ["name", "status", "createdAt"] as const;
export type BranchSortField = (typeof BRANCH_SORT_FIELDS)[number];

export class ListBranchesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Şube adında arar" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @ApiPropertyOptional({ enum: BranchStatus })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @ApiPropertyOptional({ enum: BRANCH_SORT_FIELDS, default: "createdAt" })
  @IsOptional()
  @IsIn(BRANCH_SORT_FIELDS)
  sortBy: BranchSortField = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
