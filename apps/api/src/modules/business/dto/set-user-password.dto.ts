import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

// Distinct from auth/dto/reset-password.dto.ts's ResetPasswordDto (the
// self-service, token-based "forgot password" flow) - this is a
// TENANT_OWNER/BRANCH_MANAGER directly setting a new temporary password for
// one of their staff, no token involved. Same password policy either way.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class SetUserPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalıdır." })
  @Matches(PASSWORD_PATTERN, { message: "Şifre en az bir harf ve bir rakam içermelidir." })
  newPassword!: string;
}
