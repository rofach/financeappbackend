import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  balance?: number;
}
