import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('givebanners')
export class GiveBanner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    img: string;
}
