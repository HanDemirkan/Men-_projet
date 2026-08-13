import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TenantUserStatus } from "@qr-platform/database";
import { ROLE_VALUES } from "@qr-platform/permissions";
import type { Role } from "@qr-platform/permissions";
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

// Same policy as ResetPasswordDto/bootstrap-admin - one password policy for
// the whole system.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      "Bu e-postayla zaten bir kullanıcı varsa yalnızca bu işletmeye üyelik eklenir, şifre yok sayılır - mevcut şifre asla değiştirilmez.",
  })
  @IsString()
  @MinLength(8, { message: "Şifre en az 8 karakter olmalıdır." })
  @Matches(PASSWORD_PATTERN, { message: "Şifre en az bir harf ve bir rakam içermelidir." })
  password!: string;

  @ApiProperty({
    enum: ROLE_VALUES,
    description:
      "TENANT_OWNER herhangi bir rol atayabilir. BRANCH_MANAGER yalnızca CASHIER/WAITER/KITCHEN/MENU_EDITOR atayabilir - bkz. user-management.policy.ts",
  })
  @IsIn(ROLE_VALUES)
  role!: Role;

  @ApiPropertyOptional({ description: "Boş bırakılırsa işletme geneli (şubesiz) üyelik oluşur" })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: TenantUserStatus, default: TenantUserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TenantUserStatus)
  status?: TenantUserStatus;
}
