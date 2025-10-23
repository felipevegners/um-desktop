import { Prisma, prisma } from '@/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { customerData, contractData, payloadIds } = payload;

  const { id, ...restManager } = contractData?.manager;

  try {
    await prisma.contracts.update({
      where: { id: payloadIds.contractId },
      data: {
        ...contractData,
        customer: {
          update: {
            where: {
              id: payloadIds.customerId,
            },
            data: {
              ...customerData,
            },
          },
        },
        manager: {
          update: {
            where: {
              id: payloadIds.managerId,
            },
            data: {
              ...restManager,
            },
          },
        },
        branches: {
          ...contractData.branches,
        },
      },
      include: {
        customer: true,
        branches: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
      }
    }
    throw error;
  }
});
