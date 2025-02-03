import { defineStore } from "pinia";
import { createPassenger } from "~/server/services/admin/passengers";

export const usePassengerStore = defineStore("passengers", {
  state: () => {
    return {
      passengers: [],
      loading: false
    };
  },
  actions: {
    async createNewPassengerAction(passengerData: any) {
      try {
        this.loading = true;
        await createPassenger(passengerData);
      } catch (error) {
        console.log("Store Error Create Passenger -> ", error);
      } finally {
        this.loading = false;
      }
    }
  }
});
