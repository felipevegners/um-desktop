export const createCommissionService = async (commissionData: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'POST',
      body: commissionData,
    });
  } catch (error) {
    throw error;
  }
};

export const getCommissionsService = async (commissionId: string) => {
  try {
    if (commissionId) {
      return await $fetch(`/api/commissions?type=${commissionId}`);
    }

    return await $fetch('/api/commissions');
  } catch (error) {
    throw error;
  }
};

export const updtateCommissionService = async (commissionData: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'PUT',
      body: commissionData,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteCommissionService = async (commissionId: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'DELETE',
      body: { id: commissionId },
    });
  } catch (error) {
    throw error;
  }
};
