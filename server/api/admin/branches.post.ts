import { createUserAccountService } from '@/server/services/accounts';
import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const {
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
    branchManagerEmail,
    branchBudget,
    password,
    areas,
  } = payload;

  try {
    const newBranch = await prisma.branches.create({
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
        status: 'pending',
        enabled: true,
      },
    });

    await prisma.contracts.update({
      where: {
        id: contract,
      },
      data: {
        branches: {
          connect: {
            id: newBranch.id,
          },
        },
      },
    });

    const branchManagerData = {
      username: branchManagerName,
      password: password,
      email: branchManagerEmail,
      role: 'branch-manager',
      contractId: contract,
      status: 'pending',
      enabled: true,
      avatar: {},
    };

    const newAccount = await createUserAccountService(branchManagerData);
    await prisma.branches.update({
      where: {
        id: newBranch.id,
      },
      data: {
        manager: {
          connect: {
            //@ts-ignore
            id: newAccount?.id,
          },
        },
        contract: {
          connect: {
            id: contract,
          },
        },
        managerInfo: {
          phone: branchManagerPhone,
          position: branchManagerPosition,
          department: branchManagerDepartment,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Error Prisma -> ', error);
      throw error;
    }
    console.error('Error Prisma -> ', error);
    throw error;
  }
});
