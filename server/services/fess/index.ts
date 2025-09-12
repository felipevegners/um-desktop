export const createFeeService = async (feeData: any) => {
  try {
    return await $fetch('/api/fees', {
      method: 'POST',
      body: feeData,
    });
  } catch (error) {
    throw error;
  }
};

export const getFeesService = async (feeType: string) => {
  try {
    if (feeType) {
      return await $fetch(`/api/fees?type=${feeType}`);
    }

    return await $fetch('/api/fees');
  } catch (error) {
    throw error;
  }
};

export const updtateFeeService = async (feeData: any) => {
  try {
    return await $fetch('/api/fees', {
      method: 'PUT',
      body: feeData,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteFeeService = async (feeId: any) => {
  try {
    return await $fetch('/api/fees', {
      method: 'DELETE',
      body: { id: feeId },
    });
  } catch (error) {
    throw error;
  }
};
