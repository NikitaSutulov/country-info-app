import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddHolidaysDto,
  AuthDto,
  EventDto,
  HolidayInfoDto,
  TokenDto,
} from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { Event, User } from './entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async signup(authDto: AuthDto): Promise<string> {
    await this.ensureUsernameAvailable(authDto.username);
    const newUser = this.usersRepo.create(authDto);
    newUser.password = await this.hashPassword(newUser.password);
    await this.usersRepo.save(newUser);
    return 'Signed up successfully';
  }

  async login(authDto: AuthDto): Promise<TokenDto> {
    const { username, password } = authDto;
    const user = await this.usersRepo.findOneBy({ username });
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
  ): Promise<EventDto[]> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { countryCode, year, holidays } = addHolidaysDto;
    const holidaysInfo = await this.getHolidaysInfo(countryCode, year);
    const filteredHolidaysInfo = this.filterHolidaysInfo(
      holidaysInfo,
      holidays,
    );
    const newEvents = filteredHolidaysInfo.map((holidayInfo) =>
      this.eventsRepo.create({
        ...holidayInfo,
        user,
      }),
    );
    return (await this.eventsRepo.save(newEvents)).map(this.eventToDto);
  }

  async getHolidays(userId: string): Promise<EventDto[]> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return (
      await this.eventsRepo.find({ where: { user }, relations: ['user'] })
    ).map(this.eventToDto);
  }

  private async ensureUsernameAvailable(username: string): Promise<void> {
    const userWithTheSameUsername = await this.usersRepo.findOneBy({
      username,
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
      const responseData: HolidayInfoDto[] = holidaysResponse.data;
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

  private eventToDto(event: Event): EventDto {
    return {
      id: event.id,
      date: event.date,
      localName: event.localName,
      name: event.name,
      countryCode: event.countryCode,
      global: event.global,
      fixed: event.fixed,
      userId: event.user.id,
    };
  }
}
