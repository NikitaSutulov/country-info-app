import { CountryBordersInfoDto } from './country-borders-info.dto';
import { PopulationCountDto } from './population-count.dto';

export class CountryInfoDto {
  borders: CountryBordersInfoDto[];
  populationInfo: PopulationCountDto[];
  flagUrl: string;
}
