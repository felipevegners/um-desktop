import { defineStore } from "pinia";
import {
  createPassenger,
  deletePassenger,
  getPassenger,
  getPassengers,
  updatePassenger
} from "~/server/services/admin/passengers";

interface IPassengerState {
  passengers: any;
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
      viewDeleteModal: false
    };
  },
  actions: {
    async getPassengerByIdAction(passengerId: string) {
      this.isEditing = true;
      this.loading = true;
      try {
        this.passenger = await getPassenger(passengerId);
      } catch (error) {
        console.log("Store Error Get Passenger By Id -> ", error);
      } finally {
        this.loading = false;
      }
    },
    async getPassengersAction() {
      try {
        const data = await getPassengers();
        this.passengers = data;
      } catch (error) {
        console.log("Store Error Get Passengers -> ", error);
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
            (passenger: any) => passenger.id !== passengerId
          );
        }, 3000);
      }
    },
    toggleDeleteModal() {
      this.viewDeleteModal = !this.viewDeleteModal;
    },
    resetPassengerState() {
      this.passenger = {};
    },
    toggleIsEditing() {
      this.isEditing = false;
    }
  }
});
