import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import {
  CountryBordersInfoDto,
  CountryCodeDto,
  CountryFlagInfoDto,
  CountryInfoDto,
  CountryPopulationInfoDto,
  FlagsInfoDto,
  PopulationCountDto,
  PopulationInfoDto,
} from './dto';

@Injectable()
export class CountryService {
  private readonly NAGER_API_BASE_URL: string;
  private readonly COUNTRIES_NOW_API_BASE_URL: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.NAGER_API_BASE_URL =
      configService.getOrThrow<string>('NAGER_API_BASE_URL');
    this.COUNTRIES_NOW_API_BASE_URL = configService.getOrThrow<string>(
      'COUNTRIES_NOW_API_BASE_URL',
    );
  }

  async getAvailableCountries(): Promise<CountryCodeDto[]> {
    const url = this.NAGER_API_BASE_URL.concat('/AvailableCountries');
    const response = await this.httpService.axiosRef.get(url);
    return response.data;
  }

  async getCountryInfo(countryCode: string): Promise<CountryInfoDto> {
    const bordersInfo = await this.getBordersInfo(countryCode);
    const countryName = bordersInfo.commonName;
    const populationInfo = await this.getPopulationInfo(countryName);
    const flagUrl = await this.getFlagUrl(countryName);

    return {
      borders: bordersInfo.borders!,
      populationInfo,
      flagUrl,
    };
  }

  private async getBordersInfo(
    countryCode: string,
  ): Promise<CountryBordersInfoDto> {
    const bordersUrl =
      this.NAGER_API_BASE_URL.concat('/CountryInfo/').concat(countryCode);
    try {
      const bordersResponse = await this.httpService.axiosRef.get(bordersUrl);
      return bordersResponse.data;
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.status === 404) {
        throw new NotFoundException('Country not found');
      }
      throw err;
    }
  }

  private async getPopulationInfo(
    countryName: string,
  ): Promise<PopulationCountDto[]> {
    const populationUrl = this.COUNTRIES_NOW_API_BASE_URL.concat('/population');
    const populationResponse =
      await this.httpService.axiosRef.get(populationUrl);
    const responseData: PopulationInfoDto = populationResponse.data;
    const countryPopulationInfo: CountryPopulationInfoDto | undefined =
      responseData.data.find((el) => el.country === countryName);
    if (!countryPopulationInfo) {
      throw new NotFoundException('Country population data not found');
    }
    return countryPopulationInfo.populationCounts;
  }

  private async getFlagUrl(countryName: string): Promise<string> {
    const flagsInfoUrl = this.COUNTRIES_NOW_API_BASE_URL.concat('/flag/images');
    const flagsInfoResponse = await this.httpService.axiosRef.get(flagsInfoUrl);
    const responseData: FlagsInfoDto = flagsInfoResponse.data;
    const countryFlagInfo: CountryFlagInfoDto | undefined =
      responseData.data.find((el) => el.name === countryName);
    if (!countryFlagInfo) {
      throw new NotFoundException('Country flag url not found');
    }
    return countryFlagInfo.flag;
  }
}
