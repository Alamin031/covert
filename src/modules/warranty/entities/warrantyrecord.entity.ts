import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('warrantyrecords')
export class WarrantyRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  productId?: string;

  @Column({ nullable: true })
  imei?: string;

  @Column({ nullable: true })
  serial?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  purchaseDate?: Date;

  @Column({ nullable: true })
  expiryDate?: Date;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  activatedBy?: string;

  @Column({ nullable: true })
  orderNumber?: string;

  @CreateDateColumn()
  createdAt: Date;
}
