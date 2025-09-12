import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id, name, type, value, enabled, active } = payload;

  try {
    const updatedFee = await prisma.fees.update({
      where: {
        id,
      },
      data: {
        name,
        type,
        value,
        enabled,
        active,
      },
    });
    return updatedFee;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
