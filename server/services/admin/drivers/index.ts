import { Driver } from "~/types/drivers/driver-types";

export const getDrivers = async () => {
  try {
    return await $fetch(`/api/admin/drivers`);
  } catch (error) {
    console.log("Error -> ", error);
  }
};

export const getDriver = async (driverId: string) => {
  try {
    return await $fetch(`/api/admin/drivers?id=${driverId}`);
  } catch (error) {
    console.log("Error -> ", error);
  }
};

export const createDriver = async (driverData: Driver) => {
  try {
    return await $fetch("/api/admin/drivers", {
      method: "POST",
      body: driverData
    });
  } catch (error) {
    console.log("Error during POST Driver -> ", error);
  }
};
