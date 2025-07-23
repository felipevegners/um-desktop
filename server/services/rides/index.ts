export const getRideCalculationService = async (rideData: any) => {
  try {
    const response = await $fetch('/api/travels/distance', {
      method: 'GET',
      params: {
        ...rideData,
      },
    });
    return response;
  } catch (error) {
    console.error('Error -> ', error);
    return error;
  }
};
export const getRideRoutesService = async (rideData: any) => {
  try {
    const response = await $fetch('/api/travels/routes', {
      method: 'POST',
      params: {
        ...rideData,
      },
      body: rideData.waypoints,
    });
    return response;
  } catch (error) {
    console.error('Error -> ', error);
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
