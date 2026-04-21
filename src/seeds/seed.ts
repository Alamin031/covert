
import { Category } from '../modules/categories/entities/category.entity';
import { Brand } from '../modules/brands/entities/brand.entity';
import { User } from '../modules/users/entities/user.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/orderitem.entity';
import { Review } from '../modules/reviews/entities/review.entity';
import { Notification, NotificationType } from '../modules/notifications/entities/notification.entity';
import { FAQ } from '../modules/faqs/entities/faq.entity';
import { GiveawayEntry } from '../modules/giveaways/entities/giveawayentry.entity';
import { LoyaltyPoints } from '../modules/loyalty/entities/loyaltypoints.entity';
import { PolicyPage } from '../modules/policies/entities/policy.entity';
import { WarrantyRecord } from '../modules/warranty/entities/warrantyrecord.entity';
import { HomeCategory } from '../modules/homecategory/entities/homecategory.entity';
import { HeroBanner } from '../modules/herobanner/entities/herobanner.entity';

import { faker } from '@faker-js/faker';
import AppDataSource from '../config/data-source';
import { Product } from 'src/modules/products/entities/product-new.entity';

async function seed() {
    await AppDataSource.initialize();

    // Brands
    const brandRepo = AppDataSource.getRepository(Brand);
    const brands = Array.from({ length: 5 }, () => brandRepo.create({
        name: faker.company.name(),
        slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
        logo: faker.image.avatar(),
    }));
    await brandRepo.save(brands);

    // Categories (guarantee unique names)
    const categoryRepo = AppDataSource.getRepository(Category);
    const categoryNames = new Set<string>();
    const categories: Category[] = [];
    while (categories.length < 5) {
        const name = faker.commerce.department();
        if (categoryNames.has(name)) continue;
        categoryNames.add(name);
        categories.push(categoryRepo.create({
            name,
            slug: faker.helpers.slugify(name).toLowerCase(),
            description: faker.lorem.sentence(),
            banner: faker.image.url(),
            priority: faker.number.int({ min: 1, max: 10 }),
        }));
    }
    await categoryRepo.save(categories);

    // Users
    const userRepo = AppDataSource.getRepository(User);
    const users = Array.from({ length: 10 }, () => userRepo.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        password: faker.internet.password(),
        role: 'user',
        isAdmin: false,
        image: faker.image.avatar(),
    }));
    await userRepo.save(users);

    // Products (using old Product entity - skip for now as it's being replaced)
    const productRepo = AppDataSource.getRepository(Product);
    const products: Product[] = [];
    
    console.log('Skipping product seeding - using new product architecture');
    // Products will be created via the new API endpoints instead

    // Orders
    const orderRepo = AppDataSource.getRepository(Order);
    const orders = Array.from({ length: 5 }, () => orderRepo.create({
        customer: { name: faker.person.fullName(), phone: faker.phone.number() },
        orderItems: [],
        total: faker.number.int({ min: 100, max: 2000 }),
        status: 'pending',
        paymentStatus: 'pending',
        orderNumber: faker.string.alphanumeric(10),
    }));
    await orderRepo.save(orders);

    // Order Items (skip if no products)
    if (products.length > 0) {
        const orderItemRepo = AppDataSource.getRepository(OrderItem);
        const orderItems = Array.from({ length: 10 }, () => orderItemRepo.create({
            productName: faker.commerce.productName(),
            price: faker.number.int({ min: 100, max: 1000 }),
            quantity: faker.number.int({ min: 1, max: 5 }),
            color: faker.color.human(),
            storage: `${faker.number.int({ min: 32, max: 512 })}GB`,
            RAM: `${faker.number.int({ min: 2, max: 16 })}GB`,
            sim: faker.helpers.arrayElement(['Single', 'Dual']),
            display: faker.lorem.word(),
            region: faker.location.country(),
            image: faker.image.url(),
            dynamicInputs: {},
            orderId: orders[faker.number.int({ min: 0, max: orders.length - 1 })].id.toString(),
            productId: products[faker.number.int({ min: 0, max: products.length - 1 })].id.toString(),
        }));
        await orderItemRepo.save(orderItems);
    }

    // Reviews (skip if no products)
    if (products.length > 0) {
        const reviewRepo = AppDataSource.getRepository(Review);
        const reviews = Array.from({ length: 10 }, () => reviewRepo.create({
            userId: users[faker.number.int({ min: 0, max: users.length - 1 })].id.toString(),
            productId: products[faker.number.int({ min: 0, max: products.length - 1 })].id.toString(),
            rating: faker.number.int({ min: 1, max: 5 }),
            comment: faker.lorem.sentence(),
        }));
        await reviewRepo.save(reviews);
    }

    // Notifications
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notifications = Array.from({ length: 10 }, () => notificationRepo.create({
        userId: users[faker.number.int({ min: 0, max: users.length - 1 })].id.toString(),
        type: faker.helpers.arrayElement(Object.values(NotificationType)),
        title: faker.lorem.words(3),
        message: faker.lorem.sentence(),
        link: faker.internet.url(),
        read: faker.datatype.boolean(),
    }));
    await notificationRepo.save(notifications);

    // FAQs (each FAQ can belong to multiple products)
    const faqRepo = AppDataSource.getRepository(FAQ);
    const faqs = Array.from({ length: 5 }, () => {
        // Randomly assign 1-3 products to each FAQ (skip if no products)
        const uniqueProductIds = products.length > 0 
            ? Array.from(new Set(
                Array.from({ length: faker.number.int({ min: 1, max: 3 }) })
                    .map(() => products[faker.number.int({ min: 0, max: products.length - 1 })].id.toString())
              ))
            : [];
        return faqRepo.create({
            question: faker.lorem.sentence(),
            answer: faker.lorem.paragraph(),
            productIds: uniqueProductIds,
        });
    });
    await faqRepo.save(faqs);

    // Optionally, update products to include faqIds (skip if no products)
    // Note: This is skipped since we're using the new product architecture

    // Giveaway Entries
    const giveawayEntryRepo = AppDataSource.getRepository(GiveawayEntry);
    const giveawayEntries = Array.from({ length: 5 }, () => giveawayEntryRepo.create({
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        facebook: faker.internet.username(),
    }));
    await giveawayEntryRepo.save(giveawayEntries);

    // Loyalty Points
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyPoints);
    const loyaltyPoints = users.map((user) => loyaltyRepo.create({
        userId: user.id.toString(),
        points: faker.number.int({ min: 0, max: 1000 }),
        level: faker.helpers.arrayElement(['Bronze', 'Silver', 'Gold', 'Platinum']),
    }));
    await loyaltyRepo.save(loyaltyPoints);

    // Policy Pages
    const policyRepo = AppDataSource.getRepository(PolicyPage);
    const policies = Array.from({ length: 3 }, (_, i) => policyRepo.create({
        slug: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
        title: faker.lorem.words(3),
        orderIndex: i,
        content: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(['privacy', 'terms', 'refund']),
        isPublished: faker.datatype.boolean(),
    }));
    await policyRepo.save(policies);

    // Warranty Records (skip if no products)
    if (products.length > 0) {
        const warrantyRepo = AppDataSource.getRepository(WarrantyRecord);
        const warrantyRecords = Array.from({ length: 5 }, () => warrantyRepo.create({
            productId: products[faker.number.int({ min: 0, max: products.length - 1 })].id.toString(),
            imei: faker.string.numeric(15),
            serial: faker.string.alphanumeric(10),
            phone: faker.phone.number(),
            purchaseDate: faker.date.past(),
            expiryDate: faker.date.future(),
            status: faker.helpers.arrayElement(['active', 'expired', 'pending']),
            activatedBy: users[faker.number.int({ min: 0, max: users.length - 1 })].id.toString(),
            orderNumber: orders[faker.number.int({ min: 0, max: orders.length - 1 })].id.toString(),
        }));
        await warrantyRepo.save(warrantyRecords);
    }

    // Home Categories
    const homeCategoryRepo = AppDataSource.getRepository(HomeCategory);
    const homeCategories = Array.from({ length: 3 }, () => homeCategoryRepo.create({
        name: faker.commerce.department(),
        priority: faker.number.int({ min: 1, max: 10 }),
        categoryIds: [categories[faker.number.int({ min: 0, max: categories.length - 1 })].id.toString()],
        productIds: products.length > 0 ? [products[faker.number.int({ min: 0, max: products.length - 1 })].id.toString()] : [],
    }));
    await homeCategoryRepo.save(homeCategories);

    // Hero Banners
    const heroBannerRepo = AppDataSource.getRepository(HeroBanner);
    const heroBanners = Array.from({ length: 3 }, () => heroBannerRepo.create({
        img: faker.image.url(),
    }));
    await heroBannerRepo.save(heroBanners);

    console.log('All mock data seeded!');
    await AppDataSource.destroy();
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
