/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/role.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

const jwtExpiresIn: string | number = process.env.JWT_EXPIRES_IN || '7d';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change_me',
      signOptions: { expiresIn: jwtExpiresIn as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
