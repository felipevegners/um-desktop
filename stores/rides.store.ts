import {
  createRideService,
  getRidesService,
  updateRideService,
} from '@/server/services/rides';
import { defineStore } from 'pinia';
import { sanitizePhone } from '~/lib/utils';

export interface IRidesState {
  rides?: any;
  ride?: any;
  loadingData: boolean;
  loadingSetDriver: boolean;
}

export const useRidesStore = defineStore('rides', {
  state: (): IRidesState => {
    return {
      rides: [],
      ride: {},
      loadingData: false,
      loadingSetDriver: false,
    };
  },
  actions: {
    async getRidesAction() {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        this.rides = response.filter((ride: any) => ride.status !== 'canceled');
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getUserRidesAction(userId: string) {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        const filtered = response.filter((ride: any) => ride.user.id === userId);
        this.rides = filtered;
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getDriverRidesAction(driverId: string) {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        const filtered = response.filter((ride: any) => ride.driver.id === driverId);
        this.rides = filtered;
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

    async updateRideAction(rideData: any) {
      this.loadingData = true;
      try {
        return await updateRideService(rideData);
      } catch (error) {
        throw error;
      } finally {
        this.loadingData = false;
      }
    },
    async setRideDriverAction(rideId: any, driverData: any) {
      this.loadingSetDriver = true;
      try {
        const newRideData = {
          id: rideId,
          status: 'pending',
          accepted: true,
          driver: {
            id: driverData.id,
            name: driverData.name,
            phone: sanitizePhone(driverData.phone),
            email: driverData.email,
          },
        };
        return await updateRideService(newRideData);
      } catch (error) {
        throw error;
      } finally {
        this.loadingSetDriver = false;
      }
    },
  },
});
