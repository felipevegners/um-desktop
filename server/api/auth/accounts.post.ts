import { Prisma, prisma } from '@/utils/prisma';
import bcrypt from 'bcrypt';
import { mailer } from '~/server/providers/Mailer';
import { tokenGenerator } from '~/server/providers/TokenGenerator';

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
    acceptTerms,
    emailConfirmed,
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
        acceptTerms,
        emailConfirmed,
      },
    });

    // Getting request object
    const req = event.node.req;

    // Get the host URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const url = `${protocol}://${host}/validateaccount`;

    // Generating token
    const token = await tokenGenerator.generate(
      newAccount as any,
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1d',
      },
    );

    // Sending email verification
    await mailer.sendEmail(email, `${url}?token=${token}`);

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
