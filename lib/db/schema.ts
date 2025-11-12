import { pgTable, text, timestamp, uuid, boolean, integer, varchar, pgEnum, unique, index } from 'drizzle-orm/pg-core';

// ============================================================================
// USERS & PROFILES
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  country: text('country'),
  currency: text('currency'),
  contactEmail: text('contact_email'),
  whatsapp: text('whatsapp'),
  phone: text('phone'),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// PRODUCTS V2 - Complete Rebuild
// ============================================================================

export const productTypeEnum = pgEnum('product_type_v2', ['OWN', 'POD', 'DIGITAL']);
export const productStatusEnum = pgEnum('product_status_v2', ['DRAFT', 'READY']);

// Brands table (for Product Manager v3)
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdSlugUnique: unique('brands_user_id_slug_unique').on(table.userId, table.slug),
  userIdIdx: index('brands_user_id_idx').on(table.userId),
}));

// Main products table
export const products = pgTable('products_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: productTypeEnum('type').default('OWN').notNull(),
  status: productStatusEnum('status').default('DRAFT').notNull(),
  defaultImageUrl: text('default_image_url'),
  weightGrams: integer('weight_grams'),
  // Product Manager v3 fields
  youtubeUrl: text('youtube_url'),
  compareAtPriceCents: integer('compare_at_price_cents'),
  unit: varchar('unit', { length: 50 }).default('Unit'),
  trackInventory: boolean('track_inventory').default(false),
  quantity: integer('quantity').default(0),
  personalizationEnabled: boolean('personalization_enabled').default(false),
  personalizationPrompt: text('personalization_prompt'),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  userIdStatusIdx: index('products_v2_user_id_status_idx').on(table.userId, table.status),
  brandIdIdx: index('products_v2_brand_id_idx').on(table.brandId),
}));

// Product variants
export const variants = pgTable('variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }),
  optionsJson: text('options_json'), // e.g., {"size":"M","color":"Red"}
  costCents: integer('cost_cents'), // Nullable - not all products have cost
  priceCents: integer('price_cents'), // Optional base price (store_prices override)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  productIdSkuUnique: unique('variants_product_id_sku_unique').on(table.productId, table.sku),
}));

// Product media (images, videos)
export const productMedia = pgTable('product_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'cascade' }), // Nullable - can be product-level
  url: text('url').notNull(),
  alt: text('alt'),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Categories
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdSlugUnique: unique('categories_user_id_slug_unique').on(table.userId, table.slug),
}));

// Product-Category join
export const productCategories = pgTable('product_categories', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('product_categories_pk').on(table.productId, table.categoryId),
}));

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdSlugUnique: unique('tags_user_id_slug_unique').on(table.userId, table.slug),
}));

// Product-Tag join
export const productTags = pgTable('product_tags', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('product_tags_pk').on(table.productId, table.tagId),
}));

// External links (for POD - Printify integration)
export const externalLinks = pgTable('external_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'printify'
  externalProductId: text('external_product_id').notNull(),
  metadataJson: text('metadata_json'), // Store any extra data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// STORES
// ============================================================================

export const storeTypeEnum = pgEnum('store_type', ['HOTSITE', 'MINISTORE']);
export const storeStatusEnum = pgEnum('store_status', ['DRAFT', 'LIVE']);
export const storeProductVisibilityEnum = pgEnum('store_product_visibility_v2', ['VISIBLE', 'HIDDEN']);

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  type: storeTypeEnum('type').default('HOTSITE').notNull(),
  status: storeStatusEnum('status').default('DRAFT').notNull(),
  headline: text('headline'),
  subheadline: text('subheadline'),
  heroImageUrl: text('hero_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Store products - products attached to stores with overrides
export const storeProducts = pgTable('store_products_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  titleOverride: text('title_override'), // Per-store title override
  descriptionOverride: text('description_override'), // Per-store description override
  visibility: storeProductVisibilityEnum('visibility').default('HIDDEN').notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  storeIdProductIdUnique: unique('store_products_v2_store_product_unique').on(table.storeId, table.productId),
  storeIdIdx: index('store_products_v2_store_id_idx').on(table.storeId),
}));

// Store prices - per-store, per-variant pricing
export const storePrices = pgTable('store_prices_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'cascade' }), // Nullable - base product price
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeProductVariantUnique: unique('store_prices_v2_unique').on(table.storeId, table.productId, table.variantId),
  storeIdIdx: index('store_prices_v2_store_id_idx').on(table.storeId),
}));

// ============================================================================
// STRIPE & ORDERS
// ============================================================================

export const payoutAccounts = pgTable('payout_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  stripeAccountId: text('stripe_account_id').notNull().unique(),
  country: text('country').default('US').notNull(),
  chargesEnabled: boolean('charges_enabled').default(false).notNull(),
  payoutsEnabled: boolean('payouts_enabled').default(false).notNull(),
  detailsSubmitted: boolean('details_submitted').default(false).notNull(),
  lastEventAt: timestamp('last_event_at'),
  lastEventType: text('last_event_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'failed']);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  stripeAccountId: text('stripe_account_id').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  customerEmail: text('customer_email'),
  status: orderStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pendingOrders = pgTable('pending_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  stripeAccountId: text('stripe_account_id').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
