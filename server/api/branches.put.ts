import { Prisma, prisma } from '@/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    branchId,
    contract,
    branchCode,
    name,
    document,
    fantasyName,
    zipcode,
    streetName,
    streetNumber,
    complement,
    neighborhood,
    city,
    state,
    phone,
    phoneExtension,
    managerId,
    branchBudget,
    usedBudget,
    areas,
    status,
    enabled,
    allowedProducts,
  } = payload;

  try {
    await prisma.branches.update({
      where: { id: branchId },
      data: {
        branchCode,
        name,
        document,
        fantasyName,
        address: {
          zipcode,
          streetName,
          streetNumber,
          complement,
          neighborhood,
          city,
          state,
        },
        phone,
        phoneExtension,
        budget: branchBudget,
        usedBudget,
        areas,
        status,
        enabled,
        allowedProducts,
        manager: {
          connect: {
            id: managerId,
          },
        },
      },
      include: {
        manager: managerId ? true : false,
      },
    });

    await prisma.contracts.update({
      where: {
        id: contract,
      },
      data: {
        branches: {
          connect: {
            id: branchId,
          },
        },
      },
    });

    await prisma.accounts.update({
      where: {
        id: managerId,
      },
      data: {
        contract: {
          contractId: contract,
          name: `${branchCode} - ${name}`,
          branchId: branchId,
          area: 'all',
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Branch.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Branch.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Branch.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Branch.update.generic);
  }
});
