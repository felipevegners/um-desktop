export const getBranchesService = async (branchId?: string) => {
  try {
    if (branchId) {
      return await $fetch(`/api/branches?id=${branchId}`);
    }
    return await $fetch('/api/branches');
  } catch (error) {
    console.log('Error during service GET -> ', error);
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
    console.log('Error during service POST -> ', error);
    return error;
  }
};

export const updateBranchService = async (branchData?: any) => {
  try {
    await $fetch('/api/branches', {
      method: 'PUT',
      body: branchData,
    });
  } catch (error) {
    console.log('Error during update Service -> ', error);
    return error;
  }
};

export const deleteBranchService = async (id: string) => {
  try {
    await $fetch('/api/branches', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.log('Error during delete Service -> ', error);
    return error;
  }
};
