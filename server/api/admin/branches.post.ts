import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  try {
    const newBranch = await prisma.branches.create({ data: payload });
    return newBranch;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw new Error('Erro ao cadastrar novo contrato no DB', {
        cause: error.message,
      });
    }
    throw new Error('Erro ao cadastrar novo contrato no DB', {
      cause: error.message,
    });
  }
});
