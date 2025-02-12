import { Passenger } from "~/types/passengers/passenger-types";

export const getPassenger = async (passId: string) => {
  try {
    return await $fetch(`/api/admin/passengers?id=${passId}`);
  } catch (error) {
    console.log("Error -> ", error);
  }
};
export const getPassengers = async () => {
  try {
    return await $fetch("/api/admin/passengers");
  } catch (error) {
    console.log("Error -> ", error);
  }
};

export const createPassenger = async (passengerData: any) => {
  try {
    return await $fetch("/api/admin/passengers", {
      method: "POST",
      body: passengerData,
    });
  } catch (error) {
    console.log("Error during POST Passenger -> ", error);
  }
};

export const updatePassenger = async (passengerData: Passenger) => {
  try {
    await $fetch("/api/admin/passengers", {
      method: "PUT",
      body: passengerData,
    });
  } catch (error) {
    console.log("Error Service -> error ");
  }
};

export const deletePassenger = async (id: string) => {
  try {
    await $fetch("/api/admin/passengers", {
      method: "DELETE",
      body: { id },
    });
  } catch (error) {
    console.log("Error -> ", error);
  }
};
