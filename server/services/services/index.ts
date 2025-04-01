export const getServiceProfileService = async (serviceId: string) => {
  try {
    if (serviceId) {
      return await $fetch(`/api/services/services?id=${serviceId}`);
    }

    return await $fetch('/api/services/services');
  } catch (error) {
    console.log('Error -> ', error);
  }
};
export const createServiceProfileService = async (serviceData: any) => {
  try {
    return await $fetch('/api/services/services', {
      method: 'POST',
      body: serviceData,
    });
  } catch (error) {
    console.log('Error service ---> ', error);
  }
};
export const deleteServiceProfileService = async (serviceId: any) => {
  try {
    return await $fetch('/api/services/services', {
      method: 'DELETE',
      body: { id: serviceId },
    });
  } catch (error) {
    console.log('Error service ---> ', error);
  }
};
