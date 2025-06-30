import { type Driver } from '~/types/drivers/driver-types';

export const getDrivers = async () => {
  try {
    return await $fetch(`/api/drivers`);
  } catch (error) {
    console.log('Error -> ', error);
    throw error;
  }
};

export const getDriver = async (driverId: string) => {
  try {
    return await $fetch(`/api/drivers?id=${driverId}`);
  } catch (error) {
    console.log('Error -> ', error);
    throw error;
  }
};

export const createDriver = async (driverData: Driver) => {
  try {
    return await $fetch('/api/drivers', {
      method: 'POST',
      body: driverData,
    });
  } catch (error) {
    console.log('Error during POST Driver -> ', error);
    throw error;
  }
};

export const updateDriver = async (driverData: Driver) => {
  try {
    return await $fetch('/api/drivers', {
      method: 'PUT',
      body: driverData,
    });
  } catch (error) {
    console.log('Error during PUT Driver -> ', error);
    throw error;
  }
};

export const deleteDriver = async (id: string) => {
  try {
    await $fetch('/api/drivers', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.log('Error -> ', error);
    throw error;
  }
};
