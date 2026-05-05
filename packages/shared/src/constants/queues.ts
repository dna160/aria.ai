/**
 * @CLAUDE_CONTEXT
 * Package : packages/shared
 * File    : src/constants/queues.ts
 * Role    : BullMQ queue name constants — single source of truth
 * Imports : nothing (zero deps)
 * Exports : QUEUES constant object and QueueName type
 * DO NOT  : Import from @aria/* or apps/*
 */
export const QUEUES = {
  INGEST: 'aria-ingest',
  TRACKING: 'aria-tracking',
  PAYMENT_EXPIRY: 'aria-payment-expiry',
  STOCK_RELEASE: 'aria-stock-release',
  RESTOCK_NOTIFY: 'aria-restock-notify',
  SEND_TEMPLATE: 'aria-send-template',
  // Flow Engine v2.1
  FLOW_EXECUTION: 'aria-flow-execution',
  TEMPLATE_SYNC: 'aria-template-sync',
  RISK_SCORE: 'aria-risk-score',
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];
