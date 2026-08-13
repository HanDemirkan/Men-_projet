import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsPositive, IsOptional, IsString, Min, MaxLength } from "class-validator";

export class CreateVariantDto {
  @ApiProperty({ example: "Küçük" })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
