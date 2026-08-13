import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PRODUCT_TAGS } from "@qr-platform/shared";
import type { ProductTag } from "@qr-platform/shared";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Min,
  MaxLength,
} from "class-validator";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: "Boş bırakılırsa isimden otomatik üretilir" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, { message: "Slug yalnızca küçük harf, rakam ve tire içerebilir." })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imageId?: string;

  @ApiPropertyOptional({ description: "Dakika" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional({ description: "Serbest metin, ör. \"Gluten, süt ürünleri\"" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergens?: string;

  @ApiPropertyOptional({ description: "Diyet/stil etiketleri", enum: PRODUCT_TAGS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(PRODUCT_TAGS, { each: true })
  tags?: ProductTag[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
