import { ApiPropertyOptional } from "@nestjs/swagger";
import { TenantUserStatus } from "@qr-platform/database";
import { ROLE_VALUES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import { IsEnum, IsIn, IsOptional, IsUUID } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ROLE_VALUES })
  @IsOptional()
  @IsIn(ROLE_VALUES)
  role?: Role;

  @ApiPropertyOptional({ description: "null gönderilirse şubesiz (işletme geneli) yapılır" })
  @IsOptional()
  @IsUUID()
  branchId?: string | null;

  @ApiPropertyOptional({ enum: TenantUserStatus, description: "Aktif/pasif yap" })
  @IsOptional()
  @IsEnum(TenantUserStatus)
  status?: TenantUserStatus;
}
