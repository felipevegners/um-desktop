import { prisma } from '~/utils/prisma';

type BranchId = {
  id?: string;
  contractId?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<BranchId>(event);
  const branchId = query.id;
  const contractId = query.contractId;
  if (branchId) {
    const branch = await prisma.branches.findUnique({
      where: {
        id: branchId,
      },
      include: {
        manager: {
          omit: {
            password: true,
          },
        },
      },
    });

    return branch;
  }
  if (contractId) {
    const branches = await prisma.branches.findMany({
      where: {
        contractId: contractId,
      },
      include: {
        manager: {
          omit: {
            password: true,
          },
        },
      },
    });
    return branches;
  }
  const branches = await prisma.branches.findMany({
    include: {
      manager: {
        omit: {
          password: true,
        },
      },
    },
  });

  return branches;
});
