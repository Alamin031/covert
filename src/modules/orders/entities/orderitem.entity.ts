import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('orderitems')
export class OrderItem {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    productName: string;

    @Column()
    price: number;

    @Column({ default: 1 })
    quantity: number;

    @Column({ nullable: true })
    color?: string;

    @Column({ nullable: true })
    colorName?: string;  // NEW FIELD

    @Column({ nullable: true })
    storage?: string;

    @Column({ nullable: true })
    storageName?: string;  // NEW FIELD

    @Column({ nullable: true })
    RAM?: string;

    @Column({ nullable: true })
    sim?: string;

    @Column({ nullable: true })
    display?: string;

    @Column({ nullable: true })
    region?: string;

    @Column({ nullable: true })
    regionName?: string;  // NEW FIELD

    @Column({ nullable: true })
    carePlanId?: string;  // Selected care plan ID

    @Column({ nullable: true })
    carePlanName?: string;  // Selected care plan name

    @Column({ nullable: true })
    carePrice?: number;  // Price of the selected care plan

    @Column({ nullable: true })
    careDuration?: string;  // Duration/tenure of the care plan

    @Column({ nullable: true })
    priceType?: string;  // NEW FIELD (offer/regular)

    @Column({ nullable: true })
    image?: string;

    @Column({ type: 'json', nullable: true })
    dynamicInputs?: any;

    @Column({ type: 'json', nullable: true })
    selectedVariants?: any;  // NEW FIELD - full variant object store korar jonno

    @Column()
    orderId: string;

    @Column()
    productId: string;
    // IMEI and serial moved to OrderItemUnit
}