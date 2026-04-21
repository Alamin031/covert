import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
// import { Category } from '../../categories/entities/category.entity';
// import { Product } from '../../products/entities/product.entity';

@Entity('homecategories')
export class HomeCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;


    @Column({ nullable: true })
    priority?: number;


    @Column('uuid', { array: true, nullable: true })
    categoryIds?: string[];




    @Column('uuid', { array: true, nullable: true })
    productIds?: string[];



    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
