import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessAuthGuard extends AuthGuard('jwt-access') {}

@Injectable()
export class RefreshAuthGuard extends AuthGuard('jwt-refresh') {}
