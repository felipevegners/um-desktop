import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id, name, description, price, enabled } = payload;

  try {
    const updatedService = await prisma.services.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        price,
        enabled,
      },
    });
    return updatedService;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
