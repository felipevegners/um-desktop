import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    id,
    type,
    ammount,
    availableAt,
    status,
    discounts,
    discountType,
    ride,
    driver,
  } = payload;

  try {
    const updatedCommission = await prisma.commissions.update({
      where: {
        id,
      },
      data: {
        type,
        ammount,
        availableAt,
        status,
        discounts,
        discountType,
        ride,
        driver,
      },
    });
    return updatedCommission;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma During Edit Commission -> ', error.message);
      }
    }
    throw error;
  }
});
