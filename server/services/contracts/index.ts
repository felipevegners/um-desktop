export const getContractsService = async (contractId: string) => {
  try {
    if (contractId) {
      return await $fetch(`/api/contracts/contracts?id=${contractId}`);
    }
    return await $fetch('/api/contracts/contracts');
  } catch (error) {
    console.log('Error during service GET -> ', error);
  }
};

export const createContractService = async (contractData: any) => {
  try {
    return await $fetch('/api/contracts/contracts', {
      method: 'POST',
      body: contractData,
    });
  } catch (error) {
    console.log('Error during service POST -> ', error);
  }
};
