import { prisma } from '~/utils/prisma';

type CommissionId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<CommissionId>(event);
  const commissionId = query.id;
  if (commissionId) {
    const commission = await prisma.commissions.findUnique({
      where: {
        id: commissionId,
      },
    });
    return commission;
  }

  const commissions = await prisma.commissions.findMany();
  return commissions;
});
