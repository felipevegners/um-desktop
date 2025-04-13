import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  omit: {
    accounts: {
      password: true,
    },
  },
});

export { prisma, Prisma };
