export const getRideCalculationService = async (rideData: any) => {
  try {
    const response = await $fetch('/api/distances/distance', {
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
