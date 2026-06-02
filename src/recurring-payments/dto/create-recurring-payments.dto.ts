import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { PaymentFrequency } from '../enums/payment-frequency.enum';

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

  @IsEnum(PaymentFrequency)
  @IsNotEmpty()
  frequency: PaymentFrequency;

  @IsDateString()
  @IsNotEmpty()
  beginDate: string;
}
