import { prisma } from '~/utils/prisma';

type BranchId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<BranchId>(event);
  const branchId = query.id;
  if (branchId) {
    const branch = await prisma.branches.findUnique({
      where: {
        id: branchId,
      },
    });

    return branch;
  }
  const branches = await prisma.branches.findMany();

  return branches;
});
