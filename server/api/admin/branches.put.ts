import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const { branchId } = payload;

  try {
    await prisma.branches.update({
      where: { id: branchId },
      data: payload,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
        throw error;
      }
    }
    throw error;
  }
});
