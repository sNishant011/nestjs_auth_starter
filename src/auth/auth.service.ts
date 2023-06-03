import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, envVariables } from 'src';
import { UserService } from 'src/user/user.service';
import { isPasswordValid } from 'src/utils/auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService<envVariables>,
  ) {}

  async validateUser(email: string, password: string): Promise<JwtPayload> {
    const user = await this.userService.findOneByEmail(email);
    if (user) {
      const isMatch = await isPasswordValid(password, user.password);
      if (isMatch) {
        return {
          email: user.email,
          id: user.id,
          role: user.role,
        };
      }
      return null;
    }
    return null;
  }

  async login(
    user: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.generateToken(user);
    this.userService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async generateToken(payload: JwtPayload) {
    const jwtVariables = this.configService.get('jwt', { infer: true });
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtVariables.accessTokenSecret,
        expiresIn: jwtVariables.accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtVariables.refreshTokenSecret,
        expiresIn: jwtVariables.refreshTokenExpiry,
      }),
    ]);
    return { accessToken, refreshToken };
  }
  async logout(userId: number) {
    this.userService.updateRefreshToken(userId, null);
  }
}
