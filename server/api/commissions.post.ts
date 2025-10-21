import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newCommission = await prisma.commissions.create({ data: payload });
    return newCommission;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma During Post Commission -> ', error.message);
      }
    }
    throw error;
  }
});
