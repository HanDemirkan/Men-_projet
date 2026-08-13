import { ApiPropertyOptional } from "@nestjs/swagger";
import { BranchStatus } from "@qr-platform/database";
import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBranchDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleMapsLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: BranchStatus, description: "Aktif/pasif yap" })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
