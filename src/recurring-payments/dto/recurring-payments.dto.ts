import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecurringPaymentsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
