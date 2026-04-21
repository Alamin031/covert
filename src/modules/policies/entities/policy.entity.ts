import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('policypages')
export class PolicyPage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string;

    @Column()
    title: string;

    @Column()
    type: string;


    @Column({ default: 0 })
    orderIndex: number;

    @Column({ default: false })
    isPublished: boolean;

    @Column({ nullable: true })
    content?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
