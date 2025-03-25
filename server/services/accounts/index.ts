export const getUsersAccountsService = async (accountId: string) => {
  try {
    if (accountId) {
      return await $fetch(`/api/auth/accounts?id=${accountId}`);
    }

    return await $fetch('/api/auth/accounts');
  } catch (error) {
    console.log('Error -> ', error);
  }
};

export const createUserAccountService = async (accountData: any) => {
  try {
    return await $fetch('/api/auth/accounts', {
      method: 'POST',
      body: accountData,
    });
  } catch (error) {
    console.log('Error during POST Account -> ', error);
  }
};

export const deleteUserAccountService = async (accountId: string) => {
  try {
    return await $fetch('/api/auth/accounts', {
      method: 'DELETE',
      body: accountId,
    });
  } catch (error) {
    console.log('Error during DELETE Account -> ', error);
  }
};
