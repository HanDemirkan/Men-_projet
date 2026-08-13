import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TenantStatus } from "@qr-platform/database";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Same policy as ResetPasswordDto/bootstrap-admin - one password policy for
// the whole system, not a second one invented here.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: "Boş bırakılırsa işletme adından otomatik üretilir" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, { message: "Slug yalnızca küçük harf, rakam ve tire içerebilir." })
  slug?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  ownerFirstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  ownerLastName!: string;

  @ApiProperty()
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({
    description:
      "Sahip zaten bir kullanıcıysa (e-posta eşleşirse) yalnızca yeni işletmeye TENANT_OWNER üyeliği eklenir, bu şifre yok sayılır - mevcut şifre asla değiştirilmez.",
  })
  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalıdır." })
  @Matches(PASSWORD_PATTERN, { message: "Şifre en az bir harf ve bir rakam içermelidir." })
  ownerPassword!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  branchName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: TenantStatus, default: TenantStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
