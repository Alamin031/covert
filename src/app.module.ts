import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SslCommerzModule } from './modules/sslcommerz/sslcommerz.module';
import { WarrantyModule } from './modules/warranty/warranty.module';
import { GiveawaysModule } from './modules/giveaways/giveaways.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { SeoModule } from './modules/seo/seo.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { AdminModule } from './modules/admin/admin.module';
import { HomecategoryModule } from './modules/homecategory/homecategory.module';
import { HerobannerModule } from './modules/herobanner/herobanner.module';
import { EmiModule } from './modules/emi/emi.modul';
import { BlogModule } from './modules/blog/blog.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { DeliveryMethodModule } from './modules/delivery-method/delivery-method.module';
import { CorporateDealModule } from './modules/corporate-deal/corporate-deal.module';
import { FlashsellModule } from './modules/flashsell/flashsell.module';
import { MetaModule } from './modules/meta/meta.module';
import { RolesModule } from './modules/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'fd_telecom',
      ...(process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : {}),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    OrdersModule,
    SslCommerzModule,
    WarrantyModule,
    GiveawaysModule,
    PoliciesModule,
    FaqsModule,
    ReviewsModule,
    LoyaltyModule,
    SeoModule,
    MarketingModule,
    AdminModule,
    HomecategoryModule,
    HerobannerModule,
    EmiModule,
    BlogModule,
    NotificationModule,
    DeliveryMethodModule,
    CorporateDealModule,
    FlashsellModule,
    MetaModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
