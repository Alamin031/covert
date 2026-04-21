import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('warrantylogs')
export class WarrantyLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    warrantyId: string;

    @Column()
    action: string;

    @Column({ type: 'json', nullable: true })
    changes?: any;

    @Column({ nullable: true })
    admin?: string;

    @CreateDateColumn()
    createdAt: Date;
}
