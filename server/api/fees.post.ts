import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newFee = await prisma.fees.create({ data: payload });
    return newFee;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.debug('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
