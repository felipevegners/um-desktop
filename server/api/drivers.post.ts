import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const { password, ...rest } = payload;

  const accountData = {
    username: rest.name,
    document: rest.document,
    email: rest.email,
    password: password,
    role: 'platform-driver',
    enabled: true,
    status: 'pending',
    phone: rest.phone,
    position: '',
    department: '',
    acceptTerms: false,
    emailConfirmed: false,
    avatar: {
      name: '',
      url: '',
    },
    contract: {
      contractId: '-',
      name: '-',
      branchId: '-',
      area: '-',
    },
  };
  try {
    const newAccount = await prisma.accounts.create({
      data: accountData,
    });

    if (newAccount) {
      const newDriver = await prisma.drivers.create({
        data: {
          id: newAccount.id,
          ...rest,
        },
      });
      return newDriver;
    }
  } catch (error) {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        throw createError({
          statusCode: 409,
          statusMessage: 'E-mail já cadastrado!',
          message: `Já existe uma conta vinculada a este e-mail: "${rest.email}". Tente novamente!`,
        });
      }
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
