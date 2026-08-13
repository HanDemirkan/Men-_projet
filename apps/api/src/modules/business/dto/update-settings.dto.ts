import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
const PRICE_DISPLAY_FORMATS = ["WITH_CURRENCY", "NUMBER_ONLY"] as const;

class QrDefaultsDto {
  @ApiPropertyOptional({ enum: QR_ERROR_CORRECTION_LEVELS })
  @IsOptional()
  @IsIn(QR_ERROR_CORRECTION_LEVELS)
  errorCorrectionLevel?: (typeof QR_ERROR_CORRECTION_LEVELS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeLogo?: boolean;
}

// `language`/`currency` are deliberately NOT here - they're Tenant's own
// flat columns, already editable via PATCH /business-profile (see
// BusinessSettingsService, which reads/writes them from there directly so
// there's exactly one source of truth even though both screens expose them).
export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: "IANA saat dilimi, ör. Europe/Istanbul" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({ description: "ör. DD.MM.YYYY" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;

  @ApiPropertyOptional({ enum: PRICE_DISPLAY_FORMATS })
  @IsOptional()
  @IsIn(PRICE_DISPLAY_FORMATS)
  priceDisplayFormat?: (typeof PRICE_DISPLAY_FORMATS)[number];

  @ApiPropertyOptional({ type: QrDefaultsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrDefaultsDto)
  qrDefaults?: QrDefaultsDto;
}
