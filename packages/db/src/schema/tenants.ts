/**
 * @CLAUDE_CONTEXT
 * Package : packages/db
 * File    : src/schema/tenants.ts
 * Role    : Drizzle ORM schema for tenants table and related enums
 * Imports : drizzle-orm/pg-core only
 * Exports : tenants, wabaStatusEnum, subscriptionTierEnum
 * DO NOT  : Import from apps/* or packages except @aria/shared and drizzle-orm
 */
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';

export const wabaStatusEnum = pgEnum('waba_status', [
  'pending',
  'registering',
  'pending_verification',
  'active',
  'suspended',
  'manual_required',
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'trial',
  'growth',
  'pro',
  'scale',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  lynkUserId: varchar('lynk_user_id', { length: 255 }).notNull().unique(),
  storeName: varchar('store_name', { length: 255 }).notNull(),
  wabaId: varchar('waba_id', { length: 255 }),
  wabaStatus: wabaStatusEnum('waba_status').default('pending'),
  originCityId: varchar('origin_city_id', { length: 50 }),
  originCityName: varchar('origin_city_name', { length: 100 }),
  paymentAccountId: varchar('payment_account_id', { length: 255 }),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('trial'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  metaBusinessId: varchar('meta_business_id', { length: 255 }),
  /** Meta phone_number_id — routes incoming Meta webhooks to this tenant */
  metaPhoneNumberId: varchar('meta_phone_number_id', { length: 50 }),
  displayPhoneNumber: varchar('display_phone_number', { length: 20 }),
  /** AES-256-GCM encrypted System User access token for this tenant's WABA */
  metaAccessToken: text('meta_access_token'),
  /** Meta messaging tier (1, 2, 3, or unlimited via 4) — drives daily template caps */
  messagingTier: integer('messaging_tier').notNull().default(1),
  /** Meta-reported quality rating: GREEN / YELLOW / RED */
  wabaQualityRating: varchar('waba_quality_rating', { length: 10 }),
  /** Last time tenant_risk_scores was computed for this tenant */
  lastRiskScoreAt: timestamp('last_risk_score_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
