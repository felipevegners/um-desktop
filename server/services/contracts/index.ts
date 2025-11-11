export const getContractsService = async (contractId: string) => {
  try {
    if (contractId) {
      return await $fetch(`/api/contracts?id=${contractId}`);
    }
    return await $fetch('/api/contracts');
  } catch (error) {
    console.log('Error during service GET -> ', error);
    throw error;
  }
};

export const createContractService = async (contractData: any) => {
  try {
    return await $fetch('/api/contracts', {
      method: 'POST',
      body: contractData,
    });
  } catch (error) {
    console.log('Error during service POST -> ', error);
    throw error;
  }
};

export const updateContractService = async (contractData: any) => {
  try {
    await $fetch('/api/contracts', {
      method: 'PUT',
      body: contractData,
    });
  } catch (error) {
    console.log('Error during update Service -> ', error);
    throw error;
  }
};
export const deleteContractService = async (id: string) => {
  try {
    await $fetch('/api/contracts', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    throw error;
  }
};
