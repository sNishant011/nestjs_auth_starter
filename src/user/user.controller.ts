import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Role } from 'src/auth/decorator/role.decorator';
import { UserRole } from './entities/user.entity';
import { ExpressRequestWithJWT, JwtPayload } from 'src';
import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from 'src/auth/guard/role.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('profile')
  async getProfile(@Req() req: ExpressRequestWithJWT) {
    const { id } = req.user;
    const user = this.userService.findOne(id);
    return user;
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: ExpressRequestWithJWT,
  ) {
    if (
      createUserDto.role === UserRole.ADMIN ||
      createUserDto.role === UserRole.PROVIDER ||
      createUserDto.role === UserRole.DRIVER
    ) {
      const token = req.cookies['token'];
      if (token) {
        const user = (await this.jwtService.verifyAsync(token)) as JwtPayload;
        if (user.role === 'admin') {
          return this.userService.create(createUserDto);
        }
      }
      throw new UnauthorizedException('You cannot create this user');
    }
    const { role, ...userWithoutRole } = createUserDto;
    return this.userService.create(userWithoutRole);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN, UserRole.PROVIDER])
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN, UserRole.PROVIDER, UserRole.DRIVER, UserRole.COMMUTER])
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: ExpressRequestWithJWT) {
    const user = request.user;
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.PROVIDER ||
      user.id === id
    ) {
      return this.userService.findOne(id);
    }
    throw new ForbiddenException('You are not authorized to view this.');
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN, UserRole.PROVIDER, UserRole.DRIVER, UserRole.COMMUTER])
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: ExpressRequestWithJWT,
  ) {
    const user = request.user;
    if (user.role === UserRole.ADMIN || user.id === id) {
      if (
        updateUserDto.role &&
        updateUserDto.role !== 'commuter' &&
        user.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('You are not authorized to edit this.');
      }
      return this.userService.update(id, updateUserDto);
    }
    throw new ForbiddenException('You are not authorized to edit this.');
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN])
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
