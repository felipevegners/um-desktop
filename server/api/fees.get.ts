import { prisma } from '~/utils/prisma';

type FeeType = {
  type: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<FeeType>(event);
  const feeType = query.type;
  if (feeType) {
    const fee = await prisma.fees.findUnique({
      where: {
        type: feeType,
      },
    });

    return fee;
  }
  const products = await prisma.fees.findMany();

  return products;
});
