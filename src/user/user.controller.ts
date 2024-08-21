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
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/auth/decorator/role.decorator';
import { User, UserRole } from './entities/user.entity';
import { ExpressRequestWithJWT, JwtPayload } from 'src';
import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { AccessAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AccessAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('profile')
  async getProfile(@Req() req: ExpressRequestWithJWT) {
    const { id } = req.user;
    const user = this.userService.findOne(id);
    return user;
  }

  @ApiCreatedResponse({
    type: User,
  })
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: ExpressRequestWithJWT,
  ) {
    if (createUserDto.role === UserRole.ADMIN) {
      const token = req.cookies['token'];
      if (token) {
        const user = (await this.jwtService.verifyAsync(token)) as JwtPayload;
        if (user.role === 'admin') {
          return this.userService.create(createUserDto);
        }
      }
      throw new UnauthorizedException('You cannot create this user');
    }
    const { role: _role, ...userWithoutRole } = createUserDto;
    return this.userService.create(userWithoutRole);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN])
  @UseGuards(AccessAuthGuard, RoleGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AccessAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: ExpressRequestWithJWT) {
    const user = request.user;
    if (user.role === UserRole.ADMIN || user.id === +id) {
      return this.userService.findOne(+id);
    }
    throw new ForbiddenException('You are not authorized to view this.');
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AccessAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: ExpressRequestWithJWT,
  ) {
    const user = request.user;
    if (user.role === UserRole.ADMIN || user.id === +id) {
      if (updateUserDto.role && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You are not authorized to edit this.');
      }
      return this.userService.update(+id, updateUserDto);
    }
    throw new ForbiddenException('You are not authorized to edit this.');
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Role([UserRole.ADMIN])
  @UseGuards(AccessAuthGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
