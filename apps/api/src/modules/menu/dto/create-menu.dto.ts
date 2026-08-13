import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { MenuStatus } from "@qr-platform/database";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";

export class CreateMenuDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MenuStatus })
  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  activeFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  activeUntil?: string;
}
