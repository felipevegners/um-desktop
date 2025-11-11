import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const { password, ...rest } = payload;

  const accountData = {
    username: rest.name,
    document: rest.document,
    email: rest.email,
    password: password,
    role: 'platform-driver',
    enabled: true,
    status: 'pending',
    phone: rest.phone,
    position: '',
    department: '',
    acceptTerms: false,
    emailConfirmed: false,
    avatar: {
      name: '',
      url: '',
    },
    contract: {
      contractId: '-',
      name: '-',
      branchId: '-',
      area: '-',
    },
  };
  try {
    const newAccount = await prisma.accounts.create({
      data: accountData,
    });

    if (newAccount) {
      const newDriver = await prisma.drivers.create({
        data: {
          id: newAccount.id,
          ...rest,
        },
      });
      return newDriver;
    }
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Driver.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Driver.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Driver.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Driver.update.generic);
  }
});
