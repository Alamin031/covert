import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bottombanners')
export class BottomBanner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    img: string;
}
