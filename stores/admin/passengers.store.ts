import { defineStore } from "pinia";
import {
  createPassenger,
  deletePassenger,
  getPassenger,
  updatePassenger,
} from "~/server/services/admin/passengers";

interface IPassengerState {
  passengers: any[];
  passenger: any;
  isEditing: boolean;
  loading: boolean;
  viewDeleteModal: boolean;
}

export const usePassengerStore = defineStore("passengers", {
  state: (): IPassengerState => {
    return {
      passengers: [],
      passenger: {},
      isEditing: false,
      loading: false,
      viewDeleteModal: false,
    };
  },
  actions: {
    async getPassengerById(passengerId: string) {
      console.log("Chamou a store");
      try {
        this.loading = true;
        this.isEditing = true;
        this.passenger = await getPassenger(passengerId);
      } catch (error) {
        console.log("Store Error Get Passenger By Id -> ", error);
      } finally {
        setTimeout(() => {
          this.loading = false;
        }, 2000);
      }
    },
    async createNewPassengerAction(passengerData: any) {
      try {
        this.loading = true;
        this.isEditing = false;
        await createPassenger(passengerData);
      } catch (error) {
        console.log("Store Error Create Passenger -> ", error);
      } finally {
        setTimeout(() => {
          this.loading = false;
        }, 2000);
      }
    },

    async updatePassengerAction(passengerData: any) {
      try {
        this.loading = true;
        this.isEditing = false;
        await updatePassenger(passengerData);
      } catch (error) {
        console.log("Store Error Update Passenger -> ", error);
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
    toggleDeleteModal() {
      this.viewDeleteModal = !this.viewDeleteModal;
    },
  },
});
