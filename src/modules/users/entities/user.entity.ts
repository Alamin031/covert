import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';


@Entity('users')
export class User {
    @ObjectIdColumn()
    id: ObjectId;


    @Column()
    name: string;


    @Column({ unique: true })
    email: string;


    @Column({ nullable: true })
    phone?: string;


    @Column({ nullable: true })
    password?: string;


    @Column({ nullable: true })
    roleId?: ObjectId;

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
