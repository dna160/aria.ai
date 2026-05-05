import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      tenantId: string;
      email: string;
      iat?: number;
      exp?: number;
    };
    user: {
      tenantId: string;
      email: string;
      iat?: number;
      exp?: number;
    };
  }
}
