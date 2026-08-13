import { ApiProperty } from "@nestjs/swagger";
import { MediaType } from "@qr-platform/database";
import { IsEnum } from "class-validator";

export class UploadMediaDto {
  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  type!: MediaType;
}
