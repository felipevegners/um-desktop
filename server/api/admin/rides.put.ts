import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id, billing, user, product, reason, travel, dispatcher } = payload;

  try {
    const updatedRide = await prisma.rides.update({
      where: {
        id,
      },
      data: { billing, user, product, reason, travel, dispatcher },
    });
    return updatedRide;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
        return new Error(error.message);
      }
    }
    throw error;
  }
});
