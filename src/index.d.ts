import { Request } from 'express';
import { User } from './user/entities/user.entity';

type JwtPayload = Pick<User, 'id' | 'email' | 'role'>;

export type RequestWithJwtPayload = Request & { user: JwtPayload };
export type RequestWithUser = Request & { user: User };
export type RequestWithLoginPayload = Request & { user: LoginPayload };
export type ExpressRequestWithJWT = Request & { user: JwtPayload };
