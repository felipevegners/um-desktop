import { Prisma, prisma } from '@/utils/prisma';

function toBudgetNumber(value: unknown) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

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
    await prisma.$transaction(async (tx) => {
      const currentBranch = await tx.branches.findUnique({
        where: { id: branchId },
        select: {
          id: true,
          enabled: true,
          budget: true,
          usedBudget: true,
        },
      });

      if (!currentBranch) {
        throw new Prisma.PrismaClientKnownRequestError('Branch not found', {
          code: 'P2025',
          clientVersion: 'local',
        });
      }

      const isDisablingBranch = currentBranch.enabled !== false && enabled === false;
      const isReactivatingBranch = currentBranch.enabled === false && enabled !== false;
      let normalizedBranchBudget = branchBudget;

      if (isDisablingBranch) {
        const currentContract = await tx.contracts.findUnique({
          where: { id: contract },
          select: {
            id: true,
            mainBudget: true,
            availableBudget: true,
            branches: {
              select: {
                id: true,
                budget: true,
              },
            },
          },
        });

        if (!currentContract) {
          throw new Prisma.PrismaClientKnownRequestError('Contract not found', {
            code: 'P2025',
            clientVersion: 'local',
          });
        }

        const totalAllocatedBudget = currentContract.branches.reduce(
          (sum, branch) => sum + toBudgetNumber(branch.budget),
          0,
        );
        const fallbackAvailableBudget =
          toBudgetNumber(currentContract.mainBudget) - totalAllocatedBudget;
        const currentAvailableBudget =
          currentContract.availableBudget === null
            ? fallbackAvailableBudget
            : toBudgetNumber(currentContract.availableBudget);
        const branchRemainingBudget = Math.max(
          toBudgetNumber(currentBranch.budget) - toBudgetNumber(currentBranch.usedBudget),
          0,
        );

        await tx.contracts.update({
          where: { id: contract },
          data: {
            availableBudget: (currentAvailableBudget + branchRemainingBudget).toString(),
            branches: {
              connect: {
                id: branchId,
              },
            },
          },
        });

        normalizedBranchBudget = '0';
      } else {
        await tx.contracts.update({
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

        if (isReactivatingBranch) {
          normalizedBranchBudget = '0';
        }
      }

      await tx.branches.update({
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
          budget: normalizedBranchBudget,
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

      await tx.accounts.update({
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
