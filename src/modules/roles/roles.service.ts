import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Role } from './role.entity';
import { User } from '../users/entities/user.entity';
import { ObjectId } from 'mongodb';
import { Permission } from '../../common/enums/permission.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(data: DeepPartial<Role>) {
    const existing = await this.roleRepo.findOne({ where: { name: data.name } as any } as any);
    if (existing) throw new ConflictException('Role with this name already exists');
    const role = this.roleRepo.create(data as any);
    return this.roleRepo.save(role);
  }

  findAll() {
    return this.roleRepo.find();
  }

  async findOne(id: string) {
    const objectId = new ObjectId(id);
    // Try both `id` and `_id` lookups for Mongo compatibility
    let role = await this.roleRepo.findOne({ where: { id: objectId } as any } as any);
    if (!role) {
      role = await this.roleRepo.findOne({ where: { _id: objectId } as any } as any);
    }
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, data: Partial<Role>) {
    const role = await this.findOne(id);
    Object.assign(role, data);
    return this.roleRepo.save(role as any);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    return this.roleRepo.remove(role as any);
  }

  async assignRoleToUser(roleId: string, userId: string) {
    const role = await this.findOne(roleId);
    const uId = new ObjectId(userId);
    let user = await this.userRepo.findOne({ where: { id: uId } as any } as any);
    if (!user) throw new NotFoundException('User not found');
    // persist roleId, role name, and update isAdmin flag
    (user as any).roleId = role.id;
    user.role = role.name;
    user.isAdmin = role.name === 'admin';
    return this.userRepo.save(user as any);
  }

  async addPermissions(roleId: string, permissions: string[]) {
    const role = await this.findOne(roleId);
    const set = new Set<string>(role.permissions ?? []);
    for (const p of permissions) set.add(p);
    role.permissions = Array.from(set);
    return this.roleRepo.save(role as any);
  }
}
