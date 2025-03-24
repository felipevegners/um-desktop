import { prisma } from '@/utils/prisma';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.userName || !body.userEmail || !body.userPassword || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Campos obrigatórios inválidos',
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(body.userPassword, salt);

  const newAccount = await prisma.accounts.create({
    data: { ...body, password: hashedPassword },
  });
  return newAccount;
});
