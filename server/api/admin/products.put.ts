import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    id,
    image,
    code,
    name,
    type,
    capacity,
    price,
    basePrice,
    includedHours,
    includedKms,
    kmPrice,
    minutePrice,
    description,
    enabled,
  } = payload;

  try {
    const updatedProduct = await prisma.products.update({
      where: {
        id,
      },
      data: {
        image,
        code,
        name,
        type,
        capacity,
        price,
        basePrice,
        includedHours,
        includedKms,
        kmPrice,
        minutePrice,
        description,
        enabled,
      },
    });
    return updatedProduct;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
