export class CountryBordersInfoDto {
  commonName: string;
  officialName: string;
  countryCode: string;
  region: string;
  borders: CountryBordersInfoDto[] | null;
}
