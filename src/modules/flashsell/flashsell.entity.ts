import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('flashsells')
export class Flashsell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  bannerImg: string;

  @Column('uuid', { array: true })
  productIds: string[];

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  discountpercentage : number;

  @Column()
  stock: number;
}
