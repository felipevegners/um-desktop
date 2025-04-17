export const getContractsService = async (contractId: string) => {
  try {
    if (contractId) {
      return await $fetch(`/api/admin/contracts?id=${contractId}`);
    }
    return await $fetch('/api/admin/contracts');
  } catch (error) {
    console.log('Error during service GET -> ', error);
    return error;
  }
};

export const createContractService = async (contractData: any) => {
  try {
    return await $fetch('/api/admin/contracts', {
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
    await $fetch('/api/admin/contracts', {
      method: 'PUT',
      body: contractData,
    });
  } catch (error) {
    console.log('Error during update Service -> ', error);
    return error;
  }
};
export const deleteContractService = async (id: string) => {
  try {
    await $fetch('/api/admin/contracts', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.log('Error during delete Service -> ', error);
    return error;
  }
};
