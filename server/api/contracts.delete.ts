import { Prisma, prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;

  try {
    // DELETE ALL CUSTOMERS (COMPANIES) AND MASTER MANAGER
    await prisma.contracts.update({
      where: {
        id,
      },
      data: {
        customer: {
          delete: {},
        },
        manager: {
          delete: {},
        },
      },
    });
    // FIND ALL CONTRACT BRANCHES
    const contractBranchesIds = await prisma.branches.findMany({
      where: {
        contractId: id,
      },
      select: {
        id: true,
      },
    });

    if (contractBranchesIds.length) {
      // DELETE BRANCHES MANAGERS
      contractBranchesIds.forEach(async (branch) => {
        await prisma.branches.update({
          where: {
            id: branch.id,
          },
          data: {
            manager: {
              delete: {},
            },
          },
        });
      });

      // FIND AND DELETE BRANCHES MANAGERS ACCOUNTS
      const branchManagerList = await prisma.accounts.findMany({
        where: {
          role: 'branch-manager',
        },
      });
      const findBranchManager = branchManagerList.filter(
        (manager: any) => manager.contract.contractId === id,
      );
      const branchManagersIds = findBranchManager.map((manager) => manager.id);
      await prisma.accounts.deleteMany({
        where: {
          id: {
            in: branchManagersIds,
          },
        },
      });

      // DELETE ALL CONTRACT BRANCHES
      const branchesIds = contractBranchesIds.map((branch) => branch.id);
      await prisma.branches.deleteMany({
        where: {
          id: {
            in: branchesIds,
          },
        },
      });
    }

    // FINALY, DELETE CONTRACT
    await prisma.contracts.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        handlePrismaError(error, ErrorMessages.Account.update.notFound);
      }
      if (error.code === 'P2002') {
        handlePrismaError(error, ErrorMessages.Account.update.duplicate);
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      handlePrismaError(error, ErrorMessages.Account.update.validation);
    }
    handlePrismaError(error, ErrorMessages.Account.update.generic);
  }
});
