import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsNewArchitecture1733184000000 implements MigrationInterface {
  name = 'CreateProductsNewArchitecture1733184000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notifications_type_enum" AS ENUM (
          'ORDER_UPDATE',
          'PROMOTION',
          'GIVEAWAY',
          'SYSTEM',
          'PRODUCT_STOCK_OUT',
          'ADMIN_ORDER_PLACED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL UNIQUE,
        "slug" text NOT NULL UNIQUE,
        "indexNumber" integer,
        "logo" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL UNIQUE,
        "permissions" text[],
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL UNIQUE,
        "slug" text UNIQUE,
        "description" text,
        "banner" text,
        "priority" integer,
        "homeCategoryId" uuid,
        "brandsId" uuid,
        "faqIds" uuid[],
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_categories_brand" FOREIGN KEY ("brandsId") REFERENCES "brands" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcategories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL UNIQUE,
        "slug" text UNIQUE,
        "description" text,
        "banner" text,
        "priority" integer,
        "categoryId" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_subcategories_category" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "phone" text,
        "password" text,
        "roleId" uuid,
        "role" text NOT NULL DEFAULT 'user',
        "isAdmin" boolean NOT NULL DEFAULT false,
        "image" text,
        "myrewardPoints" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_users_role" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "slug" text UNIQUE,
        "shortDescription" text,
        "description" text,
        "categoryId" uuid,
        "categoryIds" uuid[],
        "brandId" uuid,
        "brandIds" uuid[],
        "productCode" text UNIQUE,
        "sku" text UNIQUE,
        "warranty" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "isOnline" boolean NOT NULL DEFAULT true,
        "isPos" boolean NOT NULL DEFAULT true,
        "isPreOrder" boolean NOT NULL DEFAULT false,
        "isOfficial" boolean NOT NULL DEFAULT false,
        "freeShipping" boolean NOT NULL DEFAULT false,
        "isEmi" boolean NOT NULL DEFAULT false,
        "isCare" boolean NOT NULL DEFAULT false,
        "delivery" text,
        "easyReturns" text,
        "rewardPoints" integer NOT NULL DEFAULT 0,
        "ratingPoint" integer DEFAULT 0,
        "minBookingPrice" integer NOT NULL DEFAULT 0,
        "productType" text NOT NULL DEFAULT 'basic',
        "price" integer,
        "comparePrice" integer,
        "stockQuantity" integer,
        "lowStockAlert" integer,
        "seoTitle" text,
        "seoDescription" text,
        "seoKeywords" text[],
        "seoCanonical" text,
        "tags" text[],
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        "faqIds" uuid[],
        "schemaCode" text,
        CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_products_brand" FOREIGN KEY ("brandId") REFERENCES "brands" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_regions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "regionName" text NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_regions_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_product_regions_product_region" UNIQUE ("productId", "regionName")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_networks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "networkType" text NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "priceAdjustment" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_networks_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_product_networks_product_network" UNIQUE ("productId", "networkType")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_colors" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid,
        "regionId" uuid,
        "networkId" uuid,
        "colorName" text NOT NULL,
        "colorImage" text,
        "hasStorage" boolean NOT NULL DEFAULT true,
        "useDefaultStorages" boolean NOT NULL DEFAULT true,
        "singlePrice" integer,
        "singleComparePrice" integer,
        "singleDiscountPercent" integer,
        "singleDiscountPrice" integer,
        "singleStockQuantity" integer,
        "singleLowStockAlert" integer,
        "regularPrice" integer,
        "discountPrice" integer,
        "stockQuantity" integer,
        "features" text,
        "isDefault" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_colors_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_colors_region" FOREIGN KEY ("regionId") REFERENCES "product_regions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_colors_network" FOREIGN KEY ("networkId") REFERENCES "product_networks" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_color_product_unique" ON "product_colors" ("productId", "colorName") WHERE "productId" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_color_region_unique" ON "product_colors" ("regionId", "colorName") WHERE "regionId" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_color_network_unique" ON "product_colors" ("networkId", "colorName") WHERE "networkId" IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_storages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "colorId" uuid,
        "regionId" uuid,
        "networkId" uuid,
        "storageSize" text NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_storages_color" FOREIGN KEY ("colorId") REFERENCES "product_colors" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_storages_region" FOREIGN KEY ("regionId") REFERENCES "product_regions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_storages_network" FOREIGN KEY ("networkId") REFERENCES "product_networks" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_storage_color_unique" ON "product_storages" ("colorId", "storageSize") WHERE "colorId" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_storage_region_unique" ON "product_storages" ("regionId", "storageSize") WHERE "regionId" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_storage_network_unique" ON "product_storages" ("networkId", "storageSize") WHERE "networkId" IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_prices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "storageId" uuid NOT NULL UNIQUE,
        "regularPrice" integer NOT NULL,
        "comparePrice" integer,
        "discountPrice" integer,
        "discountPercent" integer,
        "campaignPrice" integer,
        "campaignStart" timestamp,
        "campaignEnd" timestamp,
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "lowStockAlert" integer NOT NULL DEFAULT 5,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_prices_storage" FOREIGN KEY ("storageId") REFERENCES "product_storages" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "imageUrl" text NOT NULL,
        "isThumbnail" boolean NOT NULL DEFAULT false,
        "altText" text,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_images_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_videos" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "videoUrl" text NOT NULL,
        "videoType" text,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_videos_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_specifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "specKey" text NOT NULL,
        "specValue" text NOT NULL,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_product_specifications_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_product_specifications_product_key" UNIQUE ("productId", "specKey")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_cares" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productIds" uuid[],
        "categoryIds" uuid[],
        "planName" text NOT NULL,
        "price" integer NOT NULL,
        "duration" text,
        "description" text,
        "features" text[],
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "customer" jsonb,
        "fullName" text,
        "email" text,
        "phone" text,
        "division" text,
        "district" text,
        "upzila" text,
        "postCode" text,
        "address" text,
        "paymentMethod" text,
        "deliveryMethod" text,
        "totalRewardPoints" integer NOT NULL DEFAULT 0,
        "total" integer NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "statusHistory" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "paymentStatus" text NOT NULL DEFAULT 'pending',
        "orderNumber" text UNIQUE,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orderitems" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productName" text NOT NULL,
        "price" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "color" text,
        "colorName" text,
        "storage" text,
        "storageName" text,
        "RAM" text,
        "sim" text,
        "display" text,
        "region" text,
        "regionName" text,
        "carePlanId" text,
        "carePlanName" text,
        "carePrice" integer,
        "careDuration" text,
        "priceType" text,
        "image" text,
        "dynamicInputs" jsonb,
        "selectedVariants" jsonb,
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        CONSTRAINT "FK_orderitems_order" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orderitems_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_item_units" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "orderItemId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "imei" text,
        "serial" text,
        "status" text NOT NULL DEFAULT 'assigned',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_item_units_order" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_item_units_item" FOREIGN KEY ("orderItemId") REFERENCES "orderitems" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_item_units_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wishlists" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wishlists_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wishlists_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compares" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_compares_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_compares_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_reviews_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "faqs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "productIds" uuid[],
        "categoryIds" uuid[],
        "orderIndex" integer,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" text,
        "isAdmin" boolean NOT NULL DEFAULT false,
        "type" "notifications_type_enum",
        "title" text,
        "message" text,
        "productId" text,
        "link" text,
        "read" boolean NOT NULL DEFAULT false,
        "resolved" boolean NOT NULL DEFAULT false,
        "status" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loyaltypoints" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" text NOT NULL,
        "points" integer NOT NULL DEFAULT 0,
        "level" text NOT NULL DEFAULT 'Bronze'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "giveawayentries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "phone" text NOT NULL,
        "email" text,
        "facebook" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "warrantyrecords" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "productId" text,
        "imei" text,
        "serial" text,
        "phone" text,
        "purchaseDate" timestamp,
        "expiryDate" timestamp,
        "status" text,
        "activatedBy" text,
        "orderNumber" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "warrantylogs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "warrantyId" text NOT NULL,
        "action" text NOT NULL,
        "changes" jsonb,
        "admin" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "homecategories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL UNIQUE,
        "priority" integer,
        "categoryIds" uuid[],
        "productIds" uuid[],
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "herobanners" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "img" text NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "bottombanners" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "img" text NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "givebanners" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "img" text NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "middlebanners" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "img" text NOT NULL)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blogs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "content" text NOT NULL,
        "image" varchar(255),
        "excerpt" text,
        "publishedAt" timestamp,
        "readTime" integer,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "tags" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_deals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" text NOT NULL,
        "companyName" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "message" text,
        "status" text NOT NULL DEFAULT 'new',
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policypages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "slug" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "type" text NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT false,
        "content" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "delivery_methods" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "description" text NOT NULL,
        "minDays" integer NOT NULL,
        "maxDays" integer NOT NULL,
        "extraFee" integer NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "banks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "bankname" text NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emis" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "bankId" uuid NOT NULL,
        "months" integer NOT NULL,
        "planName" text NOT NULL,
        "interestRate" double precision NOT NULL,
        CONSTRAINT "FK_emis_bank" FOREIGN KEY ("bankId") REFERENCES "banks" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashsells" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" text NOT NULL,
        "bannerImg" text NOT NULL,
        "productIds" uuid[] NOT NULL,
        "startTime" timestamp NOT NULL,
        "endTime" timestamp NOT NULL,
        "discountpercentage" integer NOT NULL,
        "stock" integer NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "flashsells"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emis"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_methods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policypages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_deals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blogs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "middlebanners"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "givebanners"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bottombanners"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "herobanners"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "homecategories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "warrantylogs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "warrantyrecords"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "giveawayentries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loyaltypoints"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "faqs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compares"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wishlists"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_item_units"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orderitems"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_cares"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_specifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_videos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_prices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_storages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_colors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_networks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_regions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subcategories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
  }
}
