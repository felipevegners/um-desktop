import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newRide = await prisma.rides.create({ data: payload });
    return newRide;
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
