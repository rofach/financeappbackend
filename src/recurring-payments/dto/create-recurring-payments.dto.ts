import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateRecurringPaymentsDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  type: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  frequency: number;

  @IsDateString()
  @IsNotEmpty()
  beginDate: string;
}
