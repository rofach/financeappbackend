import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { PaymentFrequency } from '../enums/payment-frequency.enum';
import { TransactionType } from '../../transactions/domain/transaction-type.enum';

export class CreateRecurringPaymentsDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

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
