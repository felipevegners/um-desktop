import { prisma } from '~/utils/prisma';

type AccountId = {
  id: string;
};
export default defineEventHandler(async (event) => {
  const query = getQuery<AccountId>(event);
  const accountId = query.id;
  if (accountId) {
    const customer = await prisma.accounts.findUnique({
      omit: {
        password: true,
      },
      where: {
        id: accountId,
      },
    });

    return customer;
  }
  const accounts = await prisma.accounts.findMany({
    omit: {
      password: true,
    },
  });

  return accounts;
});
