import {
  createRideService,
  getContractRidesService,
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
  getters: {
    openRides({ rides }) {
      if (rides.length > 0)
        return rides
          .filter(
            (ride: any) => ride.status !== 'completed' && ride.status !== 'cancelled',
          )
          .sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
    },
    completedRides({ rides }) {
      if (rides.length > 0)
        return rides.filter((ride: any) => ride.status === 'completed');
    },
    cancelledRides({ rides }) {
      if (rides.length > 0)
        return rides.filter((ride: any) => ride.status === 'cancelled');
    },
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
    async getRidesByContractAction(contractId: string) {
      this.loadingData = true;
      try {
        const response: any = await getContractRidesService(contractId);
        this.rides = response;
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
        const result = await createRideService(rideData);
        return { success: true, data: result };
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Erro desconhecido';
        return {
          success: false,
          error: message,
          statusCode: error?.statusCode || 500,
        };
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
