import { CountryFlagInfoDto } from './country-flag-info.dto';

export class FlagsInfoDto {
  error: boolean;
  msg: string;
  data: CountryFlagInfoDto[];
}
