const REQUEST_TIMEOUT_MS = 20000;

export const getUsersAccountsService = async (
  accountId: string,
  accountEmail: string,
) => {
  try {
    if (accountEmail.includes('@')) {
      return await $fetch(`/api/auth/accounts?email=${accountEmail}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
    if (accountId) {
      return await $fetch(`/api/auth/accounts?id=${accountId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
    return await $fetch('/api/auth/accounts', {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.debug('Error -> ', error);
    throw error;
  }
};

export const getUsersByContractIdService = async (contractId: string) => {
  try {
    return await $fetch(`/api/auth/accounts?contractId=${contractId}`, {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.debug('Error -> ', error);
    throw error;
  }
};

export const createUserAccountService = async (accountData: any) => {
  try {
    return await $fetch('/api/auth/accounts', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: accountData,
    });
  } catch (error: any) {
    throw error;
  }
};

export const updateUserAccountService = async (accountData: any) => {
  try {
    return await $fetch('/api/auth/accounts', {
      method: 'PUT',
      timeout: REQUEST_TIMEOUT_MS,
      body: accountData,
    });
  } catch (error) {
    console.debug('Error during POST Account -> ', error);
    throw error;
  }
};

export const deleteUserAccountService = async (accountId: string) => {
  try {
    return await $fetch('/api/auth/accounts', {
      method: 'DELETE',
      timeout: REQUEST_TIMEOUT_MS,
      body: { id: accountId },
    });
  } catch (error) {
    console.debug('Error during DELETE Account -> ', error);
    throw error;
  }
};
