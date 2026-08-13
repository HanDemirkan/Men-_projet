import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class RevokeSessionsDto {
  @ApiPropertyOptional({ description: "Boş bırakılırsa kullanıcının tüm oturumları sonlandırılır" })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
