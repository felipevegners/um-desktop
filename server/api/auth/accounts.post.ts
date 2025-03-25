import { prisma } from '@/utils/prisma';
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

  const newAccount = await prisma.accounts.create({
    data: { ...body, password: hashedPassword },
  });
  return newAccount;
});
