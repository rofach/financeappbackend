import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  limitAmount: number;

  @ApiProperty({ description: '1=Weekly, 2=Monthly, 3=Yearly' })
  @IsNumber()
  @IsNotEmpty()
  period: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: string;
}
