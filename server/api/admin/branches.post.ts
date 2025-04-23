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
        code: branchCode,
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

    const branchManagerData = {
      username: branchManagerName,
      password: password,
      email: branchManagerEmail,
      role: 'branch-manager',
      customerName: fantasyName,
      customerId: newBranch.id,
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
        manager: [
          {
            //@ts-expect-error
            id: newAccount.id,
            //@ts-expect-error
            name: newAccount?.username,
            //@ts-expect-error
            role: newAccount?.role,
            branchManagerPhone,
            branchManagerPosition,
            branchManagerDepartment,
          },
        ],
      },
    });

    await prisma.contracts.update({
      where: {
        id: contract,
      },
      data: {
        customerBranches: {
          connect: {
            id: newBranch.id,
          },
        },
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Error Prisma -> ', error.message);
      throw new Error('Erro ao cadastrar novo contrato no DB', {
        cause: error.message,
      });
    }
    throw new Error('Erro ao cadastrar novo contrato no DB', {
      cause: error.message,
    });
  }
});
