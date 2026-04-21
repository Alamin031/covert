import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../roles/role.entity';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;


    @Column()
    name: string;


    @Column({ unique: true })
    email: string;


    @Column({ nullable: true })
    phone?: string;


    @Column({ nullable: true })
    password?: string;


    @Column({ type: 'uuid', nullable: true })
    roleId?: string;

    @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'roleId' })
    roleEntity?: Role;

    @Column({ default: 'user' })
    role: string;


    @Column({ default: false })
    isAdmin: boolean;

    @Column({ nullable: true })
    image?: string;


    @Column({ nullable: true })
    myrewardPoints?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
