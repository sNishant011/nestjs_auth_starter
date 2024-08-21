import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload, envVariables } from 'src';
import { UserService } from 'src/user/user.service';
import { isPasswordValid } from 'src/utils/auth.utils';
import { RefreshToken } from './entity/refresh-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService<envVariables>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<JwtPayload> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return null;
    }
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

  async login(
    user: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.generateToken(user);
    this.userService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async generateToken(payload: JwtPayload) {
    const jwtVariables = this.configService.get('jwt', { infer: true });
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtVariables.accessTokenSecret,
      expiresIn: jwtVariables.accessTokenExpiry,
    });
    let refreshToken: string;
    // check for existing refreshToken
    const refreshTokenObject = await this.getRefreshTokenByUserId(payload.id);
    if (refreshTokenObject) {
      const decoded = this.jwtService.verify(refreshTokenObject.token, {
        secret: jwtVariables.refreshTokenSecret,
        ignoreExpiration: true,
      });

      const expiryDate = new Date(decoded.exp * 1000);
      const isExpired = expiryDate < new Date();

      if (isExpired) {
        await this.refreshTokenRepository.delete(refreshTokenObject.id);
      } else {
        refreshToken = refreshTokenObject.token;
      }
    }

    if (!refreshToken) {
      refreshToken = await this.jwtService.signAsync(payload, {
        secret: jwtVariables.refreshTokenSecret,
        expiresIn: jwtVariables.refreshTokenExpiry,
      });
      await this.refreshTokenRepository.save({
        token: refreshToken,
        user: {
          id: payload.id,
        },
      });
    }
    return { accessToken, refreshToken };
  }

  async getRefreshTokenByUserId(id: number): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOneBy({ user: { id } });
  }

  async logout(userId: number) {
    this.refreshTokenRepository.delete({ user: { id: userId } });
  }
}
