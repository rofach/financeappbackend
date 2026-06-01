import { PartialType } from '@nestjs/swagger';
import { CreateRecurringPaymentsDto } from './create-recurring-payments.dto';

export class UpdateRecurringPaymentsDto extends PartialType(
  CreateRecurringPaymentsDto,
) {
  isActive?: boolean;
}
