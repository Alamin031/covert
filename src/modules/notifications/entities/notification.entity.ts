import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
    ORDER_UPDATE = 'ORDER_UPDATE',
    PROMOTION = 'PROMOTION',
    GIVEAWAY = 'GIVEAWAY',
    SYSTEM = 'SYSTEM',
    PRODUCT_STOCK_OUT = 'PRODUCT_STOCK_OUT',
    ADMIN_ORDER_PLACED = 'ADMIN_ORDER_PLACED',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;


    @Column({ nullable: true })
    userId?: string;

    @Column({ default: false })
    isAdmin?: boolean;

    @Column({ type: 'enum', enum: NotificationType })
    type?: NotificationType;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true })
    message?: string;


    @Column({ nullable: true })
    productId?: string;

    @Column({ nullable: true })
    link?: string;


    @Column({ default: false })
    read?: boolean;

    @Column({ default: false })
    resolved?: boolean;

    @Column({ nullable: true })
    status?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
