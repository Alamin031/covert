import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('loyaltypoints')
export class LoyaltyPoints {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string; // Store as string for compatibility with external user system

    @Column({ default: 0 })
    points: number;

    @Column({ default: 'Bronze' })
    level: string;
}
