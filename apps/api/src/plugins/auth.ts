import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      tenantId: string;
      email: string;
      iat?: number;
      exp?: number;
    };
  }
}

const authPluginImpl: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
        const payload = request.user as { tenantId?: string };
        if (!payload.tenantId) {
          return reply.status(401).send({ error: 'Invalid token: missing tenantId claim' });
        }
      } catch {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    }
  );
};

export const authPlugin = fp(authPluginImpl, {
  name: 'auth',
  fastify: '4.x',
});
