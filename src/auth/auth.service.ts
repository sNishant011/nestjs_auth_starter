import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { isPasswordValid } from 'src/utils/auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOneByEmail(email);
    if (user) {
      const isMatch = await isPasswordValid(password, user.password);
      if (isMatch) {
        return user;
      }
      return null;
    }
    return null;
  }

  async login(user: JwtPayload): Promise<{ token: string }> {
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt').secret,
    });
    return {
      token,
    };
  }
}
