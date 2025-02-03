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
