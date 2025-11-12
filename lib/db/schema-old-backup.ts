import { pgTable, text, timestamp, uuid, boolean, integer, serial, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Users table - for authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Profiles table - one per user, stores onboarding data
export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'), // User's name
  country: text('country'), // For currency defaults and Stripe
  currency: text('currency'), // Default currency based on country
  contactEmail: text('contact_email'), // Primary contact
  whatsapp: text('whatsapp'), // WhatsApp number
  phone: text('phone'), // Phone number
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product enums
export const productTypeEnum = pgEnum('product_type', ['POD', 'DROPSHIP', 'OWN']);
export const productStatusEnum = pgEnum('product_status', ['DRAFT', 'READY']);

// Store enums
export const storeTypeEnum = pgEnum('store_type', ['HOTSITE', 'MINISTORE']);
export const storeStatusEnum = pgEnum('store_status', ['DRAFT', 'LIVE']);
export const storeProductVisibilityEnum = pgEnum('store_product_visibility', ['VISIBLE', 'HIDDEN']);
export const visibilityStatusEnum = pgEnum('visibility_status', ['VISIBLE', 'HIDDEN', 'SCHEDULED']);

// Products table - main product data
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  productType: productTypeEnum('product_type').default('OWN').notNull(),
  status: productStatusEnum('status').default('DRAFT').notNull(),
  defaultImageUrl: text('default_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product sources - type-specific data (POD/Dropship/Own)
export const productSources = pgTable('product_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 100 }),
  providerSku: varchar('provider_sku', { length: 100 }),
  externalSupplierUrl: text('external_supplier_url'),
  leadTimeDays: integer('lead_time_days'),
  inventoryQty: integer('inventory_qty'),
  weightG: integer('weight_g'),
});

// Product variants - SKU, options, pricing
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }),
  optionsJson: text('options_json'), // JSON string of { size, color, etc. }
  costCents: integer('cost_cents').default(0).notNull(),
  priceCents: integer('price_cents').default(0).notNull(),
});

// Stores table - user's micro-stores
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

// Store products - products attached to stores
export const storeProducts = pgTable('store_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  position: integer('position').default(0).notNull(),
  visibility: storeProductVisibilityEnum('visibility').default('VISIBLE').notNull(),
});

// Store prices - per-store pricing overrides
export const storePrices = pgTable('store_prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeProductId: uuid('store_product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  priceCents: integer('price_cents').notNull(),
  compareAtCents: integer('compare_at_cents'),
  currency: text('currency').default('USD').notNull(),
  visibility: visibilityStatusEnum('visibility').default('VISIBLE').notNull(),
  startAt: timestamp('start_at'),
  endAt: timestamp('end_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payout accounts - Stripe Connect accounts
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

// Order enums
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'failed']);

// Orders - completed purchases
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
  notes: text('notes'), // Seller notes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pending orders - track sessions before webhook
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
