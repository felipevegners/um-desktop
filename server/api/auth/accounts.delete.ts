import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  try {
    const account: any = prisma.accounts.findUnique({
      where: {
        id: id,
      },
    });

    if (account && account?.role === 'platform-driver') {
      await prisma.drivers.delete({
        where: { id: id },
      });
    }
    await prisma.accounts.delete({
      where: { id: id },
    });
    return {
      statusCode: 200,
      message: 'Conta de usuário deletada com sucesso!',
    };
  } catch (error) {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record not found
      if (error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'Registro não encontrado.',
        });
      }
      // P2003: Foreign key constraint failed
      if (error.code === 'P2003') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Referência inválida aos dados relacionados.',
        });
      }
    }

    // Handle validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error(error);
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Dados inválidos fornecidos - ${error}`,
      });
    }

    // Generic error fallback
    console.error('Unexpected error -->', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Ocorreu um erro interno. Tente novamente.',
    });
  }
});
