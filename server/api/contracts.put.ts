import { Prisma, prisma } from '@/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { customerData, contractData, payloadIds } = payload;

  if (contractData.manager === null) {
    const { branches, ...restContractData } = contractData;
    try {
      await prisma.contracts.update({
        where: { id: payloadIds.contractId },
        data: {
          ...restContractData,
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
            connect: {
              //@ts-ignore
              id: payloadIds?.managerId,
            },
          },
        },
        include: {
          manager: true,
          customer: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          console.log('Error Prisma during set master manager -> ', error.message);
        }
      }
      console.error('Error during set master manager --> ', error);
      throw error;
    }
  } else {
    const { id, ...restManager } = contractData?.manager;
    const { branches, ...restContractData } = contractData;

    try {
      await prisma.contracts.update({
        where: { id: payloadIds.contractId },
        data: {
          ...restContractData,
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
        },
        include: {
          manager: true,
          customer: true,
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
  }
});
