const REQUEST_TIMEOUT_MS = 20000;

export const getContractsService = async (contractId: string) => {
  try {
    if (contractId) {
      return await $fetch(`/api/contracts?id=${contractId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
    return await $fetch('/api/contracts', {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.debug('Error during service GET -> ', error);
    throw error;
  }
};

export const createContractService = async (contractData: any) => {
  try {
    return await $fetch('/api/contracts', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: contractData,
    });
  } catch (error) {
    console.debug('Error during service POST -> ', error);
    throw error;
  }
};

export const updateContractService = async (contractData: any) => {
  try {
    await $fetch('/api/contracts', {
      method: 'PUT',
      timeout: REQUEST_TIMEOUT_MS,
      body: contractData,
    });
  } catch (error) {
    console.debug('Error during update Service -> ', error);
    throw error;
  }
};
export const deleteContractService = async (id: string) => {
  try {
    await $fetch('/api/contracts', {
      method: 'DELETE',
      timeout: REQUEST_TIMEOUT_MS,
      body: { id },
    });
  } catch (error) {
    throw error;
  }
};
