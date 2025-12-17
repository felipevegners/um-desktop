import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newRide = await prisma.rides.create({ data: payload });
    return newRide;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Ride.create.duplicate);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Ride.create.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Ride.create.validation);
    }
    handlePrismaError(error, ErrorMessages.Ride.create.generic);
  }
});
