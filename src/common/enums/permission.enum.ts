export enum Permission {
  // User Management
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  UPDATE_USER_ROLE = 'update:user:role',
  UPDATE_USER_PERMISSIONS = 'update:user:permissions',
  CREATE_ADMIN = 'create:admin',

  // Role Management
  CREATE_ROLE = 'create:role',
  READ_ROLE = 'read:role',
  UPDATE_ROLE = 'update:role',
  DELETE_ROLE = 'delete:role',
  ASSIGN_ROLE_PERMISSIONS = 'assign:role:permissions',

  // Products
  CREATE_PRODUCT = 'create:product',
  READ_PRODUCT = 'read:product',
  UPDATE_PRODUCT = 'update:product',
  DELETE_PRODUCT = 'delete:product',
  PUBLISH_PRODUCT = 'publish:product',

  // Categories
  CREATE_CATEGORY = 'create:category',
  READ_CATEGORY = 'read:category',
  UPDATE_CATEGORY = 'update:category',
  DELETE_CATEGORY = 'delete:category',

  // Brands
  CREATE_BRAND = 'create:brand',
  READ_BRAND = 'read:brand',
  UPDATE_BRAND = 'update:brand',
  DELETE_BRAND = 'delete:brand',

  // Orders
  CREATE_ORDER = 'create:order',
  READ_ORDER = 'read:order',
  UPDATE_ORDER = 'update:order',
  DELETE_ORDER = 'delete:order',
  PROCESS_REFUND = 'process:refund',

  // Reviews
  CREATE_REVIEW = 'create:review',
  READ_REVIEW = 'read:review',
  UPDATE_REVIEW = 'update:review',
  DELETE_REVIEW = 'delete:review',

  // Notifications
  CREATE_NOTIFICATION = 'create:notification',
  READ_NOTIFICATION = 'read:notification',
  UPDATE_NOTIFICATION = 'update:notification',
  DELETE_NOTIFICATION = 'delete:notification',
  MARK_NOTIFICATION_READ = 'mark:notification:read',

  // SEO & Meta
  READ_SEO = 'read:seo',
  UPDATE_SEO = 'update:seo',
  READ_META = 'read:meta',
  UPDATE_META = 'update:meta',

  // Marketing
  READ_MARKETING = 'read:marketing',
  UPDATE_MARKETING = 'update:marketing',

  // Giveaways / Flashsell
  CREATE_GIVEAWAY = 'create:giveaway',
  READ_GIVEAWAY = 'read:giveaway',
  UPDATE_GIVEAWAY = 'update:giveaway',
  DELETE_GIVEAWAY = 'delete:giveaway',
  CREATE_FLASHSELL = 'create:flashsell',
  READ_FLASHSELL = 'read:flashsell',
  UPDATE_FLASHSELL = 'update:flashsell',
  DELETE_FLASHSELL = 'delete:flashsell',

  // Hero Banner / Home Category
  CREATE_HEROBANNER = 'create:herobanner',
  READ_HEROBANNER = 'read:herobanner',
  UPDATE_HEROBANNER = 'update:herobanner',
  DELETE_HEROBANNER = 'delete:herobanner',
  CREATE_HOME_CATEGORY = 'create:homecategory',
  READ_HOME_CATEGORY = 'read:homecategory',
  UPDATE_HOME_CATEGORY = 'update:homecategory',
  DELETE_HOME_CATEGORY = 'delete:homecategory',

  // Loyalty & Rewards
  READ_LOYALTY = 'read:loyalty',
  UPDATE_LOYALTY = 'update:loyalty',

  // Warranty
  CREATE_WARRANTY = 'create:warranty',
  READ_WARRANTY = 'read:warranty',
  UPDATE_WARRANTY = 'update:warranty',
  DELETE_WARRANTY = 'delete:warranty',

  // EMI & Payment
  READ_EMI = 'read:emi',
  UPDATE_EMI = 'update:emi',
  PROCESS_PAYMENT = 'process:payment',

  // Delivery Method
  CREATE_DELIVERY = 'create:delivery',
  READ_DELIVERY = 'read:delivery',
  UPDATE_DELIVERY = 'update:delivery',
  DELETE_DELIVERY = 'delete:delivery',

  // Blog & FAQ
  CREATE_BLOG = 'create:blog',
  READ_BLOG = 'read:blog',
  UPDATE_BLOG = 'update:blog',
  DELETE_BLOG = 'delete:blog',
  CREATE_FAQ = 'create:faq',
  READ_FAQ = 'read:faq',
  UPDATE_FAQ = 'update:faq',
  DELETE_FAQ = 'delete:faq',

  // Corporate Deals
  CREATE_CORPORATE_DEAL = 'create:corporate-deal',
  READ_CORPORATE_DEAL = 'read:corporate-deal',
  UPDATE_CORPORATE_DEAL = 'update:corporate-deal',
  DELETE_CORPORATE_DEAL = 'delete:corporate-deal',

  // Policies
  CREATE_POLICY = 'create:policy',
  READ_POLICY = 'read:policy',
  UPDATE_POLICY = 'update:policy',
  DELETE_POLICY = 'delete:policy',

  // Admin Functions
  READ_LOGS = 'read:logs',
  MANAGE_SYSTEM = 'manage:system',
}
