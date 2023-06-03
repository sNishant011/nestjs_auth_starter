import { Request } from 'express';
import { User } from './user/entities/user.entity';

type JwtPayload = Pick<User, 'id' | 'email' | 'role'>;

export type RequestWithJwtPayload = Request & { user: JwtPayload };
export type RequestWithUser = Request & { user: User };
export type RequestWithLoginPayload = Request & { user: LoginPayload };
export type ExpressRequestWithJWT = Request & { user: JwtPayload };

export interface JWTConfig {
  accessTokenSecret: string;
  accessTokenExpiry: string;
  accessTokenExpiryInSeconds: number;
  refreshTokenSecret: string;
  refreshTokenExpiry: string;
  refreshTokenExpiryInSeconds: number;
}

export interface DatabaseConfig {
  host: string;
  port: string | number;
  username: string;
  password: string;
  name: string;
}

export type envVariables = {
  port: string | number;
  database: DatabaseConfig;
  jwt: JWTConfig;
};
