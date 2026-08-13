import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateBranchDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

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

  @ApiPropertyOptional({ description: "Gün başına { open, close, closed } - BusinessProfile ile aynı şekil" })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, unknown>;
}
