import { IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator';

export class CreateCategoryDto {
  @ValidateIf((o) => !o.nameUk)
  @IsNotEmpty()
  @IsString()
  nameEn?: string | null;

  @ValidateIf((o) => !o.nameEn)
  @IsNotEmpty()
  @IsString()
  nameUk?: string | null;

  @IsNotEmpty()
  @IsNumber()
  type: number;
}
