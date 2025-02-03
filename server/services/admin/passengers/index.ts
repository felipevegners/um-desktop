export const createPassenger = async (passengerData: any) => {
  try {
    return await $fetch("/api/admin/passengers", {
      method: "POST",
      body: passengerData
    });
  } catch (error) {
    console.log("Error during POST Passenger -> ", error);
  }
};
