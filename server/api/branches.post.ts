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
    usedBudget,
    allowedProducts,
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
        usedBudget: usedBudget,
        allowedProducts,
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
      contract: {
        contractId: contract,
        name: `${branchCode} - ${name}`,
        branchId: newBranch.id,
        area: 'all',
      },
      phone: branchManagerPhone,
      position: branchManagerPosition,
      department: branchManagerDepartment,
      status: 'pending',
      enabled: true,
      avatar: {
        name: '',
        url: '',
      },
      emailConfirmed: false,
      acceptTerms: false,
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
      },
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Branch.create.duplicate);
      }
      if (error.code === 'P2003') {
        handlePrismaError(error, ErrorMessages.Branch.create.invalidReference);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Branch.create.validation);
    }
    handlePrismaError(error, ErrorMessages.Branch.create.generic);
  }
});
