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
    });
    return response;
  } catch (error) {
    console.error('Error -> ', error);
    return error;
  }
};
