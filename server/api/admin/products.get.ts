import { prisma } from '~/utils/prisma';

type ProductID = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<ProductID>(event);
  const productId = query.id;
  if (productId) {
    const product = await prisma.products.findUnique({
      where: {
        id: productId,
      },
    });

    return product;
  }
  const products = await prisma.products.findMany();

  return products;
});
