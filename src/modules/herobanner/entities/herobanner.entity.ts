import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('herobanners')
export class HeroBanner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    img: string;
}
