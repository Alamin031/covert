import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('giveawayentries')
export class GiveawayEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    facebook?: string;

    @CreateDateColumn()
    createdAt: Date;
}
