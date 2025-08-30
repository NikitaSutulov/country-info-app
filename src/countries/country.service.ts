import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CountryCodeDto } from './dto/country-code.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CountryService {
  private readonly BASE_URL: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.BASE_URL = configService.getOrThrow<string>('COUNTRIES_API_BASE_URL');
  }

  async getAvailableCountries(): Promise<CountryCodeDto[]> {
    const url = this.BASE_URL.concat('/AvailableCountries');
    const result = await this.httpService.axiosRef.get(url);
    return result.data;
  }
}
