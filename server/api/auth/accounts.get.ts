import { prisma } from '~/utils/prisma';

type AccountId = {
  id?: string;
  email?: string;
  contractId?: string;
};
export default defineEventHandler(async (event) => {
  const query = getQuery<AccountId>(event);
  const accountId = query.id;
  const contractId = query.contractId;
  const accountEmail = query.email;

  if (accountEmail?.includes('@')) {
    const account = await prisma.accounts.findUnique({
      where: {
        email: accountEmail,
      },
    });

    return account;
  }

  if (accountId) {
    const account = await prisma.accounts.findUnique({
      omit: {
        password: true,
      },
      where: {
        id: accountId,
      },
    });

    return account;
  }
  const accounts = await prisma.accounts.findMany({
    omit: {
      password: true,
    },
  });

  if (contractId) {
    const filterContractAccounts = accounts.filter(
      (account: any) => account?.contract?.contractId === contractId,
    );
    return filterContractAccounts;
  }

  return accounts;
});
