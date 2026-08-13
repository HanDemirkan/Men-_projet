import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateBusinessProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, { message: "Slug yalnızca küçük harf, rakam ve tire içerebilir." })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  logoImageId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coverImageId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ description: "Kısa slogan, storefront hero alanında gösterilir" })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleMapsLink?: string;

  @ApiPropertyOptional({ description: "Gün başına açılış/kapanış saatleri" })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
