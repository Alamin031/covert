import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/role.entity';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { Repository, DeepPartial } from 'typeorm';

import { BadRequestException, NotFoundException } from '@nestjs/common';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  permissions?: string[];
}
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async decodeAuthCode(token: string): Promise<any> {
    try {
      // This both verifies and decodes the token
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const requestedRole = dto.role?.trim();
    if (requestedRole && requestedRole.toLowerCase() !== 'user') {
      throw new BadRequestException(
        'Registration through this endpoint may only create users',
      );
    }
    const roleName = 'user';
    const roleEntity = await this.roleRepo.findOne({
      where: { name: roleName },
    });
    if (!roleEntity) {
      throw new BadRequestException(`Role "${roleName}" does not exist`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user: DeepPartial<User> = {
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      isAdmin: false,
      roleId: roleEntity.id,
      role: roleEntity.name,
    };

    const savedUser = await this.userRepo.save(this.userRepo.create(user));

    const permissions = roleEntity.permissions ?? [];
    return this.login({
      id: savedUser.id?.toString?.() ?? String(savedUser.id),
      email: savedUser.email,
      name: savedUser.name,
      role: roleEntity.name,
      image: savedUser.image ?? undefined,
      permissions,
    });
  }

  async adminRegister(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user: DeepPartial<User> = {
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      isAdmin: true,
    };
    const roleName = dto.role || 'admin';
    const roleEntity = await this.roleRepo.findOne({
      where: { name: roleName },
    });
    if (!roleEntity) {
      throw new BadRequestException(`Role "${roleName}" does not exist`);
    }

    user.roleId = roleEntity.id;
    (user as any).role = roleEntity.name;
    const savedUser = await this.userRepo.save(this.userRepo.create(user));

    const resolvedRoleName = roleEntity.name;
    const resolvedPermissions = roleEntity.permissions ?? [];
    return this.login({
      id: savedUser.id?.toString?.() ?? String(savedUser.id),
      email: savedUser.email,
      name: savedUser.name,
      role: resolvedRoleName,
      image: savedUser.image ?? undefined,
      permissions: resolvedPermissions,
    });
  }

  async validateUser(email: string, plainPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;
    if (!user.password) return null;
    const matches = await bcrypt.compare(plainPassword, user.password);
    if (!matches) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async login(user: AuthUser) {
    const id = user.id?.toString?.() ?? String(user.id);
    const payload: any = { sub: id, email: user.email, role: user.role };
    if (user.permissions) payload.permissions = user.permissions;
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    };
  }

  async loginWithCredentials(email: string, password: string) {
    const valid = await this.validateUser(email, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    // resolve role/permissions for token payload using persisted role name
    let roleName = (valid as any).role ?? 'user';
    let permissions: string[] = [];
    if (roleName) {
      const role = await this.roleRepo.findOne({
        where: { name: roleName } as any,
      } as any);
      permissions = role?.permissions ?? [];
    } else if ((valid as any).roleId) {
      const role = await this.roleRepo.findOne({
        where: { id: (valid as any).roleId } as any,
      } as any);
      roleName = role?.name ?? roleName;
      permissions = role?.permissions ?? [];
    }
    return this.login({
      ...(valid as any),
      id: valid.id?.toString?.() ?? String(valid.id),
      role: roleName,
      permissions,
    });
  }

  async socialLogin(dto: SocialLoginDto) {
    let user = await this.userRepo.findOne({ where: { email: dto.email } });
    let userRole = null as Role | null;

    if (!user) {
      userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
      const newUser: DeepPartial<User> = {
        email: dto.email,
        name: dto.name,
        image: dto.avatar ?? undefined,
        isAdmin: false,
        role: userRole?.name ?? 'user',
        ...(userRole && { roleId: userRole.id }),
      };
      user = await this.userRepo.save(this.userRepo.create(newUser));
    }

    if (!user) throw new UnauthorizedException('User creation failed');

    const authUser: AuthUser = {
      id: user.id?.toString?.() ?? String(user.id),
      email: user.email,
      name: user.name,
      role: user.role ?? userRole?.name ?? 'user',
      image: user.image ?? undefined,
      permissions: userRole?.permissions ?? [],
    };
    return this.login(authUser);
  }

  //update password

  /**
   * Logout method for JWT-based authentication.
   * For stateless JWT, logout is handled on the client by removing the token.
   * If token blacklisting is implemented, add the token to a blacklist here.
   */
  async logout(token?: string): Promise<{ message: string }> {
    // For stateless JWT, just instruct the client to delete the token.
    // If you implement token blacklisting, add logic here to store the token in a blacklist.
    return { message: 'Logged out successfully' };
  }

  /**
   * Update password for a user
   * @param userId - User's id
   * @param oldPassword - Current password
   * @param newPassword - New password to set
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new BadRequestException('No password set for this user');

    const matches = await bcrypt.compare(oldPassword, user.password);
    if (!matches) throw new BadRequestException('Old password is incorrect');

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Password updated successfully' };
  }
}
