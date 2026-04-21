import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductCare } from '../../products/entities/product.care.entity';

import { Subcategory } from './subcategory.entity';
// import { HomeCategory } from '../../homecategory/entities/homecategory.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true, nullable: true })
    slug?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    banner?: string;

    @Column({ nullable: true })
    priority?: number;



    @Column({ type: 'uuid', nullable: true })
    homeCategoryId?: string;

    // Brand association: which brand this category belongs to
    @Column({ type: 'uuid', nullable: true })
    brandsId?: string;

    @Column('uuid', { array: true, nullable: true })
    faqIds?: string[];


    @OneToMany(() => Subcategory, subcategory => subcategory.category)
    subcategories?: Subcategory[];


    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
