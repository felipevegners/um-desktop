export const getRideRoutesService = async (rideData: any) => {
  try {
    const response = await $fetch('/api/travels/routes', {
      method: 'POST',
      body: {
        ...rideData,
      },
    });
    return response;
  } catch (error) {
    return error;
  }
};

export const getRidesService = async (rideId: string) => {
  try {
    if (rideId) {
      return await $fetch(`/api/rides?id=${rideId}`);
    }
    return await $fetch('/api/rides');
  } catch (error) {
    console.log('Error during service GET -> ', error);
    throw error;
  }
};

export const getContractRidesService = async (contractId: string) => {
  try {
    return await $fetch(`/api/rides?contractId=${contractId}`);
  } catch (error) {
    console.log('Error during rides by contract ID service GET -> ', error);
    throw error;
  }
};

export const getRidesByDateRangeService = async (startDate: string, endDate: string) => {
  try {
    return await $fetch(`/api/rides?startDate=${startDate}&endDate=${endDate}`);
  } catch (error) {
    console.log('Error during rides by date range service GET -> ', error);
    throw error;
  }
};

export const createRideService = async (rideData: any) => {
  try {
    return await $fetch('/api/rides', {
      method: 'POST',
      body: rideData,
    });
  } catch (error) {
    console.log('Error during service POST -> ', error);
    throw error;
  }
};

export const updateRideService = async (rideData: any) => {
  try {
    await $fetch('/api/rides', {
      method: 'PUT',
      body: rideData,
    });
  } catch (error) {
    console.log('Error during update Service -> ', error);
    throw error;
  }
};
export const deleteRideService = async (id: string) => {
  try {
    await $fetch('/api/rides', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.log('Error during delete Service -> ', error);
    throw error;
  }
};
