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
  } = body;

  try {
    const newAccount = await prisma.accounts.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        contract,
        enabled,
        status,
        avatar,
        phone,
        position,
        department,
        document,
        birthDate,
      },
    });
    return newAccount;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw new Error(error.message);
    }
    console.log('Error Prisma -> ', error.message);
    throw new Error(error.message);
  }
});
