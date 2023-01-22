import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { RequestWithJwtPayload } from 'src';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: AuthDto })
  @Post('login')
  async login(
    @Req() req: RequestWithJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = await this.authService.login(req.user);
    res.cookie('token', token, { httpOnly: true });
    return { message: 'Login success' };
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.cookies['token']) {
      res.clearCookie('token');
      return {
        message: 'Logout successful',
      };
    } else {
      return { message: 'Invalid token' };
    }
  }
}
