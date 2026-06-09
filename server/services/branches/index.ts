const REQUEST_TIMEOUT_MS = 20000;

export const getBranchesService = async (branchId?: string) => {
  try {
    if (branchId) {
      return await $fetch(`/api/branches?id=${branchId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
    return await $fetch('/api/branches', {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    throw error;
  }
};

export const getBranchesByContractIdService = async (contractId?: string) => {
  try {
    return await $fetch(`/api/branches?contractId=${contractId}`, {
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    throw error;
  }
};

export const createBranchService = async (branchData?: any) => {
  try {
    return await $fetch('/api/branches', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: branchData,
    });
  } catch (error) {
    throw error;
  }
};

export const updateBranchService = async (branchData?: any) => {
  try {
    await $fetch('/api/branches', {
      method: 'PUT',
      timeout: REQUEST_TIMEOUT_MS,
      body: branchData,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteBranchService = async (id: string) => {
  try {
    await $fetch('/api/branches', {
      method: 'DELETE',
      timeout: REQUEST_TIMEOUT_MS,
      body: { id },
    });
  } catch (error) {
    throw error;
  }
};
