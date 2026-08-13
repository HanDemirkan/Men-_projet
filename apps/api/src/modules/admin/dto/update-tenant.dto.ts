import { ApiPropertyOptional } from "@nestjs/swagger";
import { TenantStatus } from "@qr-platform/database";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: TenantStatus, description: "Aktif/pasif yap" })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
