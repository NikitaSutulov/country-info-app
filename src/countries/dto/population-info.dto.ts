import { CountryPopulationInfoDto } from './country-population-info.dto';

export class PopulationInfoDto {
  error: boolean;
  msg: string;
  data: CountryPopulationInfoDto[];
}
