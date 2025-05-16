export const getRidesService = async (rideId: string) => {
  try {
    if (rideId) {
      return await $fetch(`/api/admin/rides?id=${rideId}`);
    }
    return await $fetch('/api/admin/rides');
  } catch (error) {
    console.log('Error during service GET -> ', error);
    throw error;
  }
};

export const createRideService = async (rideData: any) => {
  try {
    return await $fetch('/api/admin/rides', {
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
    await $fetch('/api/admin/rides', {
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
    await $fetch('/api/admin/rides', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.log('Error during delete Service -> ', error);
    throw error;
  }
};
