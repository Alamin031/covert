import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('middlebanners')
export class MiddleBanner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    img: string;
}
