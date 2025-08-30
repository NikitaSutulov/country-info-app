import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class AddHolidaysDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Country code must be 2 characters long.' })
  countryCode: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  year: 2025;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  holidays: string[] | undefined;
}
