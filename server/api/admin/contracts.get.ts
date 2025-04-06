import { prisma } from '~/utils/prisma';

type ContractId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<ContractId>(event);
  const contractId = query.id;
  if (contractId) {
    const contract = await prisma.contracts.findUnique({
      where: {
        id: contractId,
      },
      include: {
        customer: true,
        manager: true,
      },
    });

    return contract;
  }
  const customers = await prisma.contracts.findMany();

  return customers;
});
