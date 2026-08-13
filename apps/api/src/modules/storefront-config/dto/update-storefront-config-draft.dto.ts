import { ApiPropertyOptional } from "@nestjs/swagger";
import { TEMPLATE_CODES } from "@qr-platform/shared";
import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

// Nested theme/layout/sections/qr/seo objects are validated loosely
// (`@IsObject`) rather than with a full class-validator tree per field -
// this is an internal dashboard surface (the tenant editing their own
// config, not arbitrary public input), and the shape is centrally defined
// once in @qr-platform/shared's StorefrontConfig type. StorefrontConfigService
// merges whatever is sent over the current template's defaults, so an
// unknown/missing nested field never produces a broken config.
export class UpdateStorefrontConfigDraftDto {
  @ApiPropertyOptional({ enum: TEMPLATE_CODES })
  @IsOptional()
  @IsIn(TEMPLATE_CODES)
  templateCode?: (typeof TEMPLATE_CODES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sections?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  qr?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  seo?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  footerText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  faviconMediaId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ogImageMediaId?: string | null;
}
