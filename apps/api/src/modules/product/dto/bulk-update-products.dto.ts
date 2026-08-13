import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsUUID, ValidateNested } from "class-validator";

class BulkProductChangesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: "true = arşivle (soft delete), false = arşivden çıkar" })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class BulkUpdateProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @ApiProperty({ type: BulkProductChangesDto })
  @ValidateNested()
  @Type(() => BulkProductChangesDto)
  data!: BulkProductChangesDto;
}
