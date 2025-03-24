export const getUsersAccountsService = async (accountId: string) => {
  try {
    if (accountId) {
      return await $fetch(`/api/auth?id=${accountId}`);
    }

    return await $fetch('/api/auth/');
  } catch (error) {
    console.log('Error -> ', error);
  }
};

export const createUserAccountService = async (accountData: any) => {
  try {
    return await $fetch('/api/auth', {
      method: 'POST',
      body: accountData,
    });
  } catch (error) {
    console.log('Error during POST Account -> ', error);
  }
};
