export const getBranchesService = async (branchId?: string) => {
  try {
    if (branchId) {
      return await $fetch(`/api/branches?id=${branchId}`);
    }
    return await $fetch('/api/branches');
  } catch (error) {
    throw error;
  }
};

export const getBranchesByContractIdService = async (contractId?: string) => {
  try {
    return await $fetch(`/api/branches?contractId=${contractId}`);
  } catch (error) {
    return error;
  }
};

export const createBranchService = async (branchData?: any) => {
  try {
    return await $fetch('/api/branches', {
      method: 'POST',
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
      body: { id },
    });
  } catch (error) {
    throw error;
  }
};
