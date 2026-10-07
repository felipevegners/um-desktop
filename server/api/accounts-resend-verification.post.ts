import { getServerSession } from '#auth';
import { sendVerificationEmailService } from '@/server/services/accounts/verification-email';
import { prisma } from '@/utils/prisma';

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event as any);
  if ((session?.user as any)?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Apenas o Backoffice pode reenviar o e-mail de verificação.',
    });
  }

  const { accountId } = await readBody(event);
  if (!accountId || typeof accountId !== 'string') {
    throw createError({ statusCode: 400, message: 'accountId é obrigatório.' });
  }

  const account = await prisma.accounts.findUnique({ where: { id: accountId } });
  if (!account) {
    throw createError({ statusCode: 404, message: 'Conta não encontrada.' });
  }
  if (account.emailConfirmed) {
    throw createError({ statusCode: 409, message: 'O e-mail desta conta já foi confirmado.' });
  }

  const emailSent = await sendVerificationEmailService(account.email);
  if (!emailSent) {
    throw createError({
      statusCode: 502,
      message: 'Não foi possível enviar o e-mail de verificação. Tente novamente.',
    });
  }
  return { success: true };
});
