import { defineStore } from "pinia";
import {
  createPassenger,
  deletePassenger,
} from "~/server/services/admin/passengers";

interface IPassengerState {
  passengers: any[];
  passenger: any;
  loading: boolean;
  viewDeleteModal: boolean;
}

export const usePassengerStore = defineStore("passengers", {
  state: (): IPassengerState => {
    return {
      passengers: [],
      passenger: {},
      loading: false,
      viewDeleteModal: false,
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
        setTimeout(() => {
          this.loading = false;
        }, 2000);
      }
    },
    async deletePassengerAction(passengerId: string) {
      try {
        this.loading = true;
        await deletePassenger(passengerId);
      } catch (error) {
        console.log("Store Error delete -> ", error);
      } finally {
        setTimeout(() => {
          this.loading = false;
          this.viewDeleteModal = false;
          this.passengers = this.passengers.filter(
            (passenger) => passenger.id !== passengerId
          );
        }, 3000);
      }
    },
  },
});
