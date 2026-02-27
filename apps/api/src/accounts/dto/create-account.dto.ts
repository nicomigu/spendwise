import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AccountType } from '../../common/enums';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsString()
  @IsOptional()
  currency?: string;
}
