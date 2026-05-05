import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, tenants } from '@aria/db';
import { eq } from '@aria/db';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  storeName: z.string().min(1, 'Store name is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, storeName } = parsed.data;

    const existing = await db.query.tenants.findFirst({ where: eq(tenants.email, email) });
    if (existing) {
      return reply.status(409).send({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [tenant] = await db.insert(tenants).values({ email, passwordHash, storeName }).returning();

    const token = fastify.jwt.sign({ tenantId: tenant.id, email }, { expiresIn: '7d' });
    return reply.status(201).send({ token, expiresIn: 7 * 24 * 60 * 60, tokenType: 'Bearer' });
  });

  fastify.post('/v1/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const { email, password } = parsed.data;

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.email, email) });
    if (!tenant) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, tenant.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign({ tenantId: tenant.id, email }, { expiresIn: '7d' });
    return reply.send({ token, expiresIn: 7 * 24 * 60 * 60, tokenType: 'Bearer' });
  });

  fastify.get('/v1/auth/me', { preHandler: fastify.authenticate }, async (request, reply) => {
    return reply.send({
      tenantId: request.user.tenantId,
      email: (request.user as any).email,
    });
  });

  fastify.post('/v1/auth/refresh', async (request, reply) => {
    const parsed = z.object({ token: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'token required' });
    try {
      const decoded = fastify.jwt.verify(parsed.data.token) as { tenantId: string; email: string };
      const token = fastify.jwt.sign({ tenantId: decoded.tenantId, email: decoded.email }, { expiresIn: '7d' });
      return reply.send({ token, expiresIn: 7 * 24 * 60 * 60, tokenType: 'Bearer' });
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });

  fastify.post('/v1/auth/logout', { preHandler: fastify.authenticate }, async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' });
  });
};
