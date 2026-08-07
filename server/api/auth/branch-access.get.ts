import { getServerSession } from '#auth';
import { prisma } from '~/utils/prisma';

function readAssignedBranchIds(contract: unknown) {
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return [] as string[];
  }

  const value = contract as Record<string, unknown>;
  const branchIds = new Set<string>();

  const branchId = value.branchId;
  if (typeof branchId === 'string' && branchId.trim() && branchId !== '-') {
    branchIds.add(branchId);
  }

  const branches = value.branches;
  if (Array.isArray(branches)) {
    for (const branch of branches) {
      if (typeof branch === 'string' && branch.trim() && branch !== '-') {
        branchIds.add(branch);
        continue;
      }

      if (!branch || typeof branch !== 'object' || Array.isArray(branch)) {
        continue;
      }

      const branchObjectId = (branch as Record<string, unknown>).id;
      if (
        typeof branchObjectId === 'string' &&
        branchObjectId.trim() &&
        branchObjectId !== '-'
      ) {
        branchIds.add(branchObjectId);
      }
    }
  }

  return [...branchIds];
}

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event as any);
  const user = (session?.user as any) ?? null;

  if (!user?.id) {
    return {
      blocked: false,
    };
  }

  const assignedBranchIds = readAssignedBranchIds(user?.contract);

  if (assignedBranchIds.length === 0) {
    return {
      blocked: false,
    };
  }

  const branches = await prisma.branches.findMany({
    where: {
      id: {
        in: assignedBranchIds,
      },
    },
    select: {
      id: true,
      enabled: true,
    },
  });

  const disabledBranch = branches.find((branch) => branch.enabled === false);

  return {
    blocked: Boolean(disabledBranch),
  };
});
