import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/role.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_me',
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // If token already contains permissions and isAdmin, use them
    if (payload.permissions) {
      return { id: payload.sub, _id: payload.sub, sub: payload.sub, email: payload.email, role: payload.role, permissions: payload.permissions };
    }

    // Otherwise, load user from DB to get latest permissions/isAdmin
    try {
      const id = new ObjectId(payload.sub);
      const user = await this.userRepo.findOne({ where: { id } as any } as any);
      if (!user) {
        return { id: payload.sub, _id: payload.sub, sub: payload.sub, email: payload.email, role: payload.role };
      }
      // Resolve role permissions from roles collection using stored role name
      let roleName = (user as any).role ?? payload.role;
      let permissions: string[] = [];
      if (roleName) {
        const role = await this.roleRepo.findOne({ where: { name: roleName } as any } as any);
        permissions = role?.permissions ?? [];
      }
      return {
        id: user.id?.toString?.() ?? String(user.id),
        _id: user.id?.toString?.() ?? String(user.id),
        sub: user.id?.toString?.() ?? String(user.id),
        email: user.email,
        role: roleName,
        permissions,
        isAdmin: user.isAdmin ?? false,
      };
    } catch (err) {
      // fallback
      return { id: payload.sub, _id: payload.sub, sub: payload.sub, email: payload.email, role: payload.role };
    }
  }
}