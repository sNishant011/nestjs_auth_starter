import {
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtPayload, RequestWithJwtPayload, envVariables } from 'src';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AccessAuthGuard, RefreshAuthGuard } from './guard/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService<envVariables>,
  ) {}

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: AuthDto })
  @Post('login')
  async login(
    @Req() req: RequestWithJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge:
        this.configService.get('jwt', { infer: true })
          .refreshTokenExpiryInSeconds * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge:
        this.configService.get('jwt', { infer: true })
          .accessTokenExpiryInSeconds * 1000,
    });
    return { message: 'Login success', user: req.user };
  }

  @UseGuards(AccessAuthGuard, RefreshAuthGuard)
  @Get('logout')
  async logout(
    @Req() req: RequestWithJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;
    await this.authService.logout(userId);
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return {
      message: 'Logout successful',
    };
  }

  @UseGuards(RefreshAuthGuard)
  @Get('refresh')
  async refreshToken(
    @Req() req: Request & { user: JwtPayload & { refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;
    // check if refresh token is valid
    const refreshToken = req.user.refreshToken;
    const isRefreshTokenValid = this.userService.isRefreshTokenValid(
      userId,
      refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new HttpException(
        {
          message: 'Invalid token',
        },
        400,
      );
    }
    // generate new token
    const tokens = await this.authService.generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    // save refresh token to db
    await this.userService.updateRefreshToken(userId, tokens.refreshToken);

    // set cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge:
        this.configService.get('jwt', { infer: true })
          .refreshTokenExpiryInSeconds * 1000,
    });
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge:
        this.configService.get('jwt', { infer: true })
          .accessTokenExpiryInSeconds * 1000,
    });
    return {
      message: 'Token refreshed successfully!',
    };
  }
}
