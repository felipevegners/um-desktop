import { Prisma, prisma } from '~/utils/prisma';

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
    branchManagerName,
    branchManagerPhone,
    branchManagerPosition,
    branchManagerDepartment,
    branchBudget,
    areas,
    status,
    enabled,
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
        areas,
        status,
        enabled,
        managerInfo: {
          phone: branchManagerPhone,
          position: branchManagerPosition,
          department: branchManagerDepartment,
        },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
        throw error;
      }
    }
    throw error;
  }
});
