import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newService = await prisma.services.create({ data: payload });
    return newService;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
