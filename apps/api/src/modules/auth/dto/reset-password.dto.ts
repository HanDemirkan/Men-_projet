import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalıdır." })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Şifre en az bir harf ve bir rakam içermelidir.",
  })
  newPassword!: string;
}
