import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const { id, ...rest } = payload;

  try {
    const updateDriver = await prisma.drivers.update({
      where: {
        id: id,
      },
      data: {
        ...rest,
      },
    });
    return updateDriver;
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
