import { mailer } from '@/server/providers/Mailer';
import { tokenGenerator } from '@/server/providers/TokenGenerator';
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

    if (newAccount && role === 'branch-manager') {
      await prisma.branches.update({
        where: {
          //@ts-ignore
          id: newAccount?.contract?.branchId,
        },
        data: {
          manager: {
            connect: {
              id: newAccount.id,
            },
          },
        },
      });
    }

    if (newAccount && role === 'platform-driver') {
      const newDriverData = {
        name: newAccount?.username,
        email: newAccount?.email,
        phone: newAccount?.phone as string,
        document: newAccount?.document,
        driverLicense: '',
        licenseCategory: '',
        licenseExpiration: '',
        address: {
          driverCars: [],
        },
        actuationArea: '',
        offers: [],
        driverFiles: {
          picture: {
            name: '',
            url: '',
          },
          cnhCopy: {
            name: '',
            url: '',
          },
          addressCopy: {
            name: '',
            url: '',
          },
          bankCopy: {
            name: '',
            url: '',
          },
        },
        rating: ['1'],
        history: [],
        status: 'pending',
        enabled: true,
      };
      await prisma.drivers.create({
        data: {
          id: newAccount.id,
          ...newDriverData,
        },
      });
    }

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
  } catch (error) {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        throw createError({
          statusCode: 409,
          statusMessage: 'E-mail já cadastrado!',
          message: `Já existe uma conta vinculada a este e-mail: "${email}". Tente novamente!`,
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
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Dados inválidos fornecidos.',
      });
    }

    // Generic error fallback
    console.error('Unexpected error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Ocorreu um erro interno. Tente novamente.',
    });
  }
});
