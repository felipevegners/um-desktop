import { Prisma, prisma } from '@/utils/prisma';
import { tokenGenerator } from '~/server/providers/TokenGenerator';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  if (!query.token) {
    return {
      status: 400,
      body: { message: 'Invalid token' },
    };
  }

  // Verify the email
  try {
    const result = (await tokenGenerator.validate(
      query.token as string,
      process.env.JWT_SECRET as string,
    )) as { email: string };

    const user = await prisma.accounts.findUnique({
      omit: {
        password: true,
      },
      where: {
        email: result.email,
      },
    });

    if (!user) {
      return {
        status: 400,
        body: { message: 'Desculpe, não encontramos sua conta.' },
      };
    }

    if (user && user.emailConfirmed) {
      return {
        status: 400,
        body: { message: 'Sua conta já foi verificada!' },
      };
    }

    await prisma.accounts.update({
      where: { email: user?.email },
      data: {
        emailConfirmed: true,
      },
    });

    return {
      status: 200,
      body: { message: 'Contra verificada com sucesso!', email: result.email },
    };
  } catch (e) {
    return {
      status: 400,
      body: {
        message: 'Desculpe, o código de verificação é inválido.',
      },
    };
  }
});
