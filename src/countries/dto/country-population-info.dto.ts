import { PopulationCountDto } from './population-count.dto';

export class CountryPopulationInfoDto {
  country: string;
  code: string;
  iso3: string;
  populationCounts: PopulationCountDto[];
}
