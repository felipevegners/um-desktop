export const useDriversLocation = () => {
  const driversWithLocation = ref<any>([]);
  const latitude = -23.55010279763851;
  const longitude = -46.63333423174097;
  const getDriversLocation = async () => {
    try {
      const response: any = await $fetch('/api/drivers');
      const driverLocation = response.map((driver: any) => {
        return {
          id: driver.id,
          name: driver.name,
          picture: driver.driverFiles.picture.url,
          lat: driver.location?.latitude || latitude,
          lng: driver.location?.longitude || longitude,
          speed: driver.location?.speed || 33,
          active: driver.scheduleOpen,
        };
      });

      driversWithLocation.value = driverLocation;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    getDriversLocation,
    driversWithLocation,
  };
};
