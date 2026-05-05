/**
 * @CLAUDE_CONTEXT
 * Package : packages/shared
 * File    : src/types/tenant.types.ts
 * Role    : Tenant TypeScript types and enums
 * Imports : nothing (zero deps)
 * Exports : Tenant, WabaStatus, SubscriptionTier
 * DO NOT  : Import from @aria/* or apps/*
 */

export enum WabaStatus {
  PENDING = 'pending',
  REGISTERING = 'registering',
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  MANUAL_REQUIRED = 'manual_required',
}

export enum SubscriptionTier {
  TRIAL = 'trial',
  GROWTH = 'growth',
  PRO = 'pro',
  SCALE = 'scale',
}

export interface Tenant {
  id: string;
  email: string;
  storeName: string;
  wabaId: string | null;
  wabaStatus: WabaStatus;
  originCityId: string | null;
  originCityName: string | null;
  paymentAccountId: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
  metaBusinessId: string | null;
  displayPhoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingFormData {
  storeName: string;
  displayPhoneNumber: string;
  metaBusinessId: string;
  originCityId: string;
  originCityName: string;
  ownerName: string;
  ownerEmail: string;
  businessCategory: string;
  businessWebsite?: string;
}
