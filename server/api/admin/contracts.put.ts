import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { customerData, contractData, payloadIds } = payload;

  try {
    await prisma.contracts.update({
      where: { id: payloadIds.contractId },
      data: {
        ...contractData,
        customerBranches: {},
        customerUsers: {},
      },
    });

    await prisma.customers.update({
      where: { id: payloadIds.customerId },
      data: customerData,
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
