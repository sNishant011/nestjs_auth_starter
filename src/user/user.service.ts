import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  getPasswordHash,
  hashRefreshToken,
  matchRefreshToken,
} from 'src/utils/auth.utils';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // using bcrypt to save password after hashing
    const { passwordHash } = await getPasswordHash(createUserDto.password, 6);
    const newUser = await this.userRepository.save({
      ...createUserDto,
      password: passwordHash,
    });
    delete newUser.password;
    delete newUser.refreshToken;
    return newUser;
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  async updateRefreshToken(id: number, refreshToken: string | null) {
    if (!refreshToken) {
      return this.userRepository.update(id, { refreshToken: null });
    }
    const { refreshTokenHash } = await hashRefreshToken(refreshToken, 7);
    return this.userRepository.update(id, { refreshToken: refreshTokenHash });
  }

  async isRefreshTokenValid(id: number, refreshToken: string) {
    const { refreshToken: refreshTokenInDB } =
      await this.userRepository.findOne({
        where: { id },
        select: { refreshToken: true },
      });
    const isMatch = await matchRefreshToken(refreshToken, refreshTokenInDB);
    return isMatch;
  }
}
