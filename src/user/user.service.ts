import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddHolidaysDto, AuthDto, HolidayInfoDto, TokenDto } from './dto';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { Event } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async signup(authDto: AuthDto): Promise<string> {
    const { username, password } = authDto;
    await this.ensureUsernameAvailable(username);
    const hashedPassword = await this.hashPassword(password);
    await this.prisma.user.create({
      data: { username, password: hashedPassword },
    });
    return 'Signed up successfully';
  }

  async login(authDto: AuthDto): Promise<TokenDto> {
    const { username, password } = authDto;
    const user = await this.prisma.user.findFirst({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new BadRequestException('Wrong credentials');
    }
    const payload = {
      sub: user.id,
      username: user.username,
    };
    return {
      id: user.id,
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async addHolidays(
    userId: string,
    addHolidaysDto: AddHolidaysDto,
  ): Promise<Event[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { countryCode, year, holidays } = addHolidaysDto;
    const holidaysInfo = await this.getHolidaysInfo(countryCode, year);
    const filteredHolidaysInfo = this.filterHolidaysInfo(
      holidaysInfo,
      holidays,
    );
    const newEvents = await Promise.all(
      filteredHolidaysInfo.map((holidayInfo) =>
        this.prisma.event.create({
          data: {
            ...holidayInfo,
            userId,
          },
        }),
      ),
    );
    return newEvents;
  }

  async getHolidays(userId: string): Promise<Event[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.prisma.event.findMany({ where: { userId } });
  }

  private async ensureUsernameAvailable(username: string): Promise<void> {
    const userWithTheSameUsername = await this.prisma.user.findFirst({
      where: {
        username,
      },
    });
    if (userWithTheSameUsername) {
      throw new BadRequestException(
        'Another user with the same username already exists',
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  private async getHolidaysInfo(
    countryCode: string,
    year: number,
  ): Promise<HolidayInfoDto[]> {
    const NAGER_API_BASE_URL =
      this.configService.getOrThrow<string>('NAGER_API_BASE_URL');
    const holidaysUrl = NAGER_API_BASE_URL.concat(
      `/PublicHolidays/${year}/${countryCode}`,
    );
    try {
      const holidaysResponse = await this.httpService.axiosRef.get(holidaysUrl);
      const responseData: HolidayInfoDto[] = holidaysResponse.data.map(
        (it: Omit<HolidayInfoDto, 'date'> & { date: string }) => {
          return {
            date: new Date(it.date),
            localName: it.localName,
            name: it.name,
            countryCode: it.countryCode,
            global: it.global,
            fixed: it.fixed,
          };
        },
      );
      return responseData;
    } catch (err) {
      if (err instanceof AxiosError && err.status === 404) {
        throw new NotFoundException('Holidays not found');
      }
      throw err;
    }
  }

  private filterHolidaysInfo(
    holidaysInfo: HolidayInfoDto[],
    filters: string[] | undefined,
  ): HolidayInfoDto[] {
    if (!filters) {
      return holidaysInfo;
    }
    return holidaysInfo.filter((holiday) => filters.includes(holiday.name));
  }
}
