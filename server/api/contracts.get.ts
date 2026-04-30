import { prisma } from '~/utils/prisma';

type ContractId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<ContractId>(event);
  const contractId = query.id;
  if (contractId) {
    // Validate contractId looks like a valid Mongo ObjectId hex string before
    // passing to Prisma. This prevents malformed ids (eg '-' or other placeholders)
    // from causing a runtime error in the MongoDB adapter.
    const isValidObjectId =
      typeof contractId === 'string' && /^[a-fA-F0-9]{24}$/.test(contractId);
    if (!isValidObjectId) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid contract id' });
    }

    const contract = await prisma.contracts.findUnique({
      where: {
        id: contractId,
      },
      include: {
        customer: true,
        branches: true,
        manager: {
          omit: {
            password: true,
          },
        },
      },
    });

    return contract;
  }
  const customers = await prisma.contracts.findMany({
    include: {
      customer: true,
      branches: true,
      manager: {
        omit: {
          password: true,
        },
      },
    },
  });

  return customers;
});
