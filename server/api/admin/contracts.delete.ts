import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;

  try {
    await prisma.contracts.update({
      where: {
        id,
      },
      data: {
        customer: {
          delete: {},
        },
        manager: {
          delete: {},
        },
      },
    });
    await prisma.contracts.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
