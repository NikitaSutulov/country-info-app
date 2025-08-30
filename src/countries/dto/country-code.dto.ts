import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CountryCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Country code must be 2 characters long.' })
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
