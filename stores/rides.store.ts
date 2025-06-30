import { createRideService, getRidesService } from '@/server/services/rides';
import { defineStore } from 'pinia';

export interface IRidesState {
  rides?: any;
  ride?: any;
  loadingData: boolean;
}

export const useRidesStore = defineStore('rides', {
  state: (): IRidesState => {
    return {
      rides: [],
      ride: {},
      loadingData: false,
    };
  },
  actions: {
    async getRidesAction() {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        this.rides = response.filter((ride: any) => ride.status === 'created');
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getRideByIdAction(rideId: string) {
      this.loadingData = true;
      try {
        const response = await getRidesService(rideId);
        this.ride = response;
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async createRideAction(rideData: any) {
      this.loadingData = true;
      try {
        return await createRideService(rideData);
      } catch (error) {
        throw error;
      } finally {
        this.loadingData = false;
      }
    },
  },
});
