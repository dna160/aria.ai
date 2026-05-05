/**
 * @CLAUDE_CONTEXT
 * Package : apps/api
 * File    : src/routes/v1/tenants.ts
 * Role    : Tenant CRUD routes. Handles Lynk.id new-member webhook, tenant info,
 *           onboarding flow trigger, and internal ops WATI activation endpoint.
 * Exports : tenantRoutes (Fastify plugin)
 * Imports : @aria/db, @aria/shared
 * DO NOT  : Expose WATI terminology in API responses — use "messaging" abstraction
 */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '@aria/db';
import { tenants } from '@aria/db';
import { eq } from '@aria/db';
import { config } from '../../config';
import { OnboardingService } from '../../services/onboarding.service';

const onboardingService = new OnboardingService();

const createTenantSchema = z.object({
  lynkUserId: z.string().min(1),
  storeName: z.string().min(1),
  originCityName: z.string().optional(),
  displayPhoneNumber: z.string().optional(),
});

const updateTenantSchema = z.object({
  storeName: z.string().min(1).optional(),
  originCityName: z.string().optional(),
  originCityId: z.string().optional(),
  displayPhoneNumber: z.string().optional(),
  metaBusinessId: z.string().optional(),
  paymentAccountId: z.string().optional(),
});

function assertInternalApiKey(request: any, reply: any): boolean {
  const apiKey = request.headers['x-internal-api-key'];
  if (apiKey !== config.LYNK_INTERNAL_API_KEY) {
    reply.status(403).send({ error: 'Forbidden' });
    return false;
  }
  return true;
}

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /v1/tenants
   * Called by Lynk.id platform when a new member subscribes to Aria.
   * Uses internal API key auth instead of JWT (machine-to-machine).
   */
  fastify.post('/v1/tenants', async (request, reply) => {
    if (!assertInternalApiKey(request, reply)) return;

    const parsed = createTenantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    // Check for existing tenant
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.lynkUserId, data.lynkUserId),
    });
    if (existing) {
      return reply.status(409).send({ error: 'Tenant already exists', tenantId: existing.id });
    }

    const [tenant] = await db
      .insert(tenants)
      .values({
        lynkUserId: data.lynkUserId,
        storeName: data.storeName,
        originCityName: data.originCityName ?? null,
        displayPhoneNumber: data.displayPhoneNumber ?? null,
        wabaStatus: 'pending',
      })
      .returning();

    request.log.info({ tenantId: tenant.id, lynkUserId: data.lynkUserId }, 'Tenant created');

    return reply.status(201).send({
      id: tenant.id,
      lynkUserId: tenant.lynkUserId,
      storeName: tenant.storeName,
      wabaStatus: tenant.wabaStatus,
      createdAt: tenant.createdAt,
    });
  });

  /**
   * GET /v1/tenants/:id
   * Returns tenant info. Auth required — tenants can only see their own data.
   */
  fastify.get<{ Params: { id: string } }>(
    '/v1/tenants/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params;

      // Tenant can only see their own data unless it's an internal request
      if (request.user.tenantId !== id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, id),
      });

      if (!tenant) {
        return reply.status(404).send({ error: 'Tenant not found' });
      }

      return reply.send(tenant);
    }
  );

  /**
   * PATCH /v1/tenants/:id
   * Update tenant settings.
   */
  fastify.patch<{ Params: { id: string } }>(
    '/v1/tenants/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params;

      if (request.user.tenantId !== id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const parsed = updateTenantSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const [updated] = await db
        .update(tenants)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: 'Tenant not found' });
      }

      return reply.send(updated);
    }
  );

  /**
   * POST /v1/tenants/:id/onboard
   * Trigger WhatsApp Business Account registration flow.
   * Called after tenant creation to kick off the messaging account setup.
   */
  fastify.post<{ Params: { id: string } }>(
    '/v1/tenants/:id/onboard',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params;

      if (request.user.tenantId !== id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, id),
      });

      if (!tenant) {
        return reply.status(404).send({ error: 'Tenant not found' });
      }

      if (tenant.wabaStatus === 'active') {
        return reply.status(409).send({
          error: 'Messaging account already active',
          status: tenant.wabaStatus,
        });
      }

      // Trigger onboarding async
      onboardingService.startOnboarding(tenant).catch(err => {
        request.log.error({ err, tenantId: id }, 'Onboarding failed');
      });

      return reply.status(202).send({
        message: 'Onboarding initiated',
        tenantId: id,
        status: 'pending',
      });
    }
  );

  /**
   * PUT /internal/tenants/:id/meta-activated
   * Internal ops endpoint — called by ops team after manual Meta WABA provisioning.
   * Sets wabaStatus = 'active' and stores encrypted Meta credentials.
   */
  fastify.put<{ Params: { id: string } }>(
    '/internal/tenants/:id/meta-activated',
    async (request, reply) => {
      if (!assertInternalApiKey(request, reply)) return;

      const bodySchema = z.object({
        metaPhoneNumberId: z.string().min(1),
        wabaId: z.string().min(1),
        metaAccessToken: z.string().min(1),
        displayPhoneNumber: z.string().optional(),
      });

      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'metaPhoneNumberId, wabaId, and metaAccessToken are required' });
      }

      const { metaPhoneNumberId, wabaId, metaAccessToken, displayPhoneNumber } = parsed.data;

      const [updated] = await db
        .update(tenants)
        .set({
          wabaStatus: 'active',
          metaPhoneNumberId,
          wabaId,
          metaAccessToken,
          displayPhoneNumber: displayPhoneNumber ?? metaPhoneNumberId,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, request.params.id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: 'Tenant not found' });
      }

      request.log.info({ tenantId: request.params.id }, 'Tenant Meta WABA activated');

      return reply.send({
        tenantId: updated.id,
        wabaStatus: updated.wabaStatus,
        updatedAt: updated.updatedAt,
      });
    }
  );
};
