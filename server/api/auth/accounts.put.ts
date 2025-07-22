import { Prisma, prisma } from '@/utils/prisma';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log('BODY --> ', body);

  if (!body.username || !body.email || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Campos obrigatórios inválidos',
    });
  }
  const {
    accountId,
    contract,
    username,
    email,
    role,
    enabled,
    status,
    avatar,
    phone,
    position,
    department,
    document,
    birthDate,
    address,
  } = body;

  const userAccount = await prisma.accounts.findUnique({
    where: {
      id: accountId,
    },
  });

  let hashedPassword;

  if (body.password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(body.password, salt);
  } else {
    hashedPassword = userAccount?.password;
  }

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
        contract,
        phone,
        position,
        department,
        document,
        birthDate,
        address,
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw error;
    }
    console.log('Error Prisma -> ', error.message);
    throw error;
  }
});
