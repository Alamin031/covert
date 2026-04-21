import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('subcategories')
export class Subcategory {
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
    categoryId?: string;

    @ManyToOne(() => Category, category => category.subcategories, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    category?: Category;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
