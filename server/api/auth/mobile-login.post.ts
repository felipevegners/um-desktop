import bcrypt from 'bcrypt';
import { createError, defineEventHandler, readBody } from 'h3';
import jwt from 'jsonwebtoken';
import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e senha são obrigatórios.',
    });
  }

  const account = await prisma.accounts.findUnique({
    where: { email },
  });

  if (!account) {
    throw createError({ statusCode: 401, statusMessage: 'Conta não encontrada.' });
  }

  if (!account.emailConfirmed) {
    throw createError({ statusCode: 401, statusMessage: 'Conta não verificada.' });
  }

  const isValid = await bcrypt.compare(password, account.password);
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Senha inválida.' });
  }

  // Atualiza isLoggedIn e tokenExpiresAt no banco
  const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
  await prisma.accounts.update({
    where: { id: account.id },
    data: { isLoggedIn: true, tokenExpiresAt },
  });

  // Gera o token JWT
  const token = jwt.sign(
    {
      id: account.id,
      email: account.email,
      role: account.role,
      enabled: account.enabled,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '30m' },
  );

  // Retorna o token, tokenExpiresAt e os dados do usuário (sem a senha)
  return {
    token,
    tokenExpiresAt,
    user: {
      ...account,
      password: undefined,
    },
  };
});
