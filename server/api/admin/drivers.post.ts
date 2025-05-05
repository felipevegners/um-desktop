import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newDriver = await prisma.drivers.create({
      data: payload,
    });
    return newDriver;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error);
      throw error;
    }
    return error;
  }
});
