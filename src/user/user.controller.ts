import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AddHolidaysDto, AuthDto } from './dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  signup(@Body() authDto: AuthDto) {
    return this.userService.signup(authDto);
  }

  @Post('login')
  login(@Body() authDto: AuthDto) {
    return this.userService.login(authDto);
  }

  @Post(':userId/calendar/holidays')
  @UseGuards(AuthGuard)
  addHolidays(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() addHolidaysDto: AddHolidaysDto,
    @Req() req: any,
  ) {
    if (req.user.id !== userId) {
      throw new ForbiddenException(
        'Forbidden to access a calendar of another user',
      );
    }
    return this.userService.addHolidays(userId, addHolidaysDto);
  }

  @Get(':userId/calendar/holidays')
  @UseGuards(AuthGuard)
  getHolidays(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
  ) {
    if (req.user.sub !== userId) {
      throw new ForbiddenException(
        'Forbidden to access a calendar of another user',
      );
    }
    return this.userService.getHolidays(userId);
  }
}
