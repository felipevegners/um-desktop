import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  try {
    const newProduct = await prisma.products.create({ data: payload });
    return newProduct;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
