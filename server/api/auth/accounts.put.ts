import { Prisma, prisma } from '@/utils/prisma';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.username || !body.email || !body.password || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Campos obrigatórios inválidos',
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(body.password, salt);

  const {
    accountId,
    contractId,
    username,
    email,
    role,
    enabled,
    status,
    avatar,
  } = body;

  try {
    await prisma.accounts.update({
      where: {
        id: accountId,
      },
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        enabled,
        status,
        avatar,
        contract: {
          connect: {
            id: contractId,
          },
        },
      },
    });

    await prisma.contracts.update({
      where: { id: contractId },
      data: {
        customerUsers: {
          connect: {
            email: email,
          },
        },
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw new Error('Erro ao cadastrar novo usuário no Banco de Dados', {
        cause: error.message,
      });
    }
    console.log('Error Prisma -> ', error.message);
    throw new Error('Erro ao cadastrar novo usuário no Banco de Dados', {
      cause: error.message,
    });
  }
});
