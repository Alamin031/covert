import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('roles')
export class Role {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  permissions?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
