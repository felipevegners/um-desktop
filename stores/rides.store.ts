import {
  createRideService,
  getContractRidesService,
  getRideByCodeService,
  getRidesByDateRangeAndContractIdService,
  getRidesByDateRangeService,
  getRidesService,
  updateRideService,
} from '@/server/services/rides';
import { defineStore } from 'pinia';
import { sanitizePhone } from '~/lib/utils';

export interface IRidesState {
  rides?: any;
  ride?: any;
  capabilities?: {
    canCreateRide?: boolean;
    canEditRide?: boolean;
    canCancelRide?: boolean;
    canRecalculateRide?: boolean;
    canAssignDriver?: boolean;
    canReadFinancial?: boolean;
  } | null;
  loadingData: boolean;
  loadingSetDriver: boolean;
}

const ACTIVE_RIDE_STATUSES = new Set([
  'created',
  'pending',
  'accepted',
  'in-progress',
  'over_quota',
  'rejected',
  // Legacy compatibility
  'refused',
]);

const normalizeRideListResponse = (payload: any) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      capabilities: null,
    };
  }

  if (payload && typeof payload === 'object') {
    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.rides)
        ? payload.rides
        : Array.isArray(payload.data)
          ? payload.data
          : [];

    return {
      items,
      capabilities:
        payload.capabilities && typeof payload.capabilities === 'object'
          ? payload.capabilities
          : null,
    };
  }

  return {
    items: [],
    capabilities: null,
  };
};

const normalizeRideDetailResponse = (payload: any) => {
  if (payload && typeof payload === 'object' && payload.ride) {
    return {
      ride: payload.ride,
      capabilities:
        payload.capabilities && typeof payload.capabilities === 'object'
          ? payload.capabilities
          : null,
    };
  }

  return {
    ride: payload,
    capabilities: null,
  };
};

export const useRidesStore = defineStore('rides', {
  state: (): IRidesState => {
    return {
      rides: [],
      ride: {},
      capabilities: null,
      loadingData: false,
      loadingSetDriver: false,
    };
  },
  getters: {
    openRides({ rides }) {
      if (rides.length > 0)
        return rides
          .filter((ride: any) => {
            const status = String(ride?.status || '').toLowerCase();
            return ACTIVE_RIDE_STATUSES.has(status);
          })
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
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        this.rides = normalized.items.filter((ride: any) => ride.status !== 'canceled');
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getUserRidesAction(userId: string) {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        const filtered = normalized.items.filter((ride: any) => ride.user.id === userId);
        this.rides = filtered;
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getRidesByDateRangeAction(
      dateRange: {
        start: { era: string; year: number; month: number; day: number };
        end: { era: string; year: number; month: number; day: number };
      } | null,
    ) {
      console.debug('Fetching rides for date range:', dateRange);
      this.loadingData = true;
      try {
        if (!dateRange || !dateRange.start || !dateRange.end) {
          this.rides = [];
          this.loadingData = false;
          return;
        }

        // Convert calendar date objects to JavaScript Date objects
        const startDate = new Date(
          dateRange.start.year,
          dateRange.start.month - 1,
          dateRange.start.day,
        );
        const endDate = new Date(
          dateRange.end.year,
          dateRange.end.month - 1,
          dateRange.end.day,
        );

        // Format dates as ISO strings for the API
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();

        console.debug(startDateISO, endDateISO);

        const response: any = await getRidesByDateRangeService(startDateISO, endDateISO);
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        this.rides = normalized.items;
        this.loadingData = false;
      } catch (error) {
        console.error('Error fetching rides by date range:', error);
        this.rides = [];
        this.loadingData = false;
        throw error;
      }
    },

    async getRidesByDateRangeAndContractIdAction(
      dateRange: {
        start: { era: string; year: number; month: number; day: number };
        end: { era: string; year: number; month: number; day: number };
      } | null,
      contractId: string,
    ) {
      console.debug('Fetching rides for date range:', dateRange);
      this.loadingData = true;
      try {
        if (!dateRange || !dateRange.start || !dateRange.end) {
          this.rides = [];
          this.loadingData = false;
          return;
        }

        // Convert calendar date objects to JavaScript Date objects
        const startDate = new Date(
          dateRange.start.year,
          dateRange.start.month - 1,
          dateRange.start.day,
        );
        const endDate = new Date(
          dateRange.end.year,
          dateRange.end.month - 1,
          dateRange.end.day,
        );

        // Format dates as ISO strings for the API
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();

        console.debug(startDateISO, endDateISO);

        const response: any = await getRidesByDateRangeAndContractIdService(
          startDateISO,
          endDateISO,
          contractId,
        );
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        this.rides = normalized.items;
        this.loadingData = false;
      } catch (error) {
        console.error('Error fetching rides by date range:', error);
        this.rides = [];
        this.loadingData = false;
        throw error;
      }
    },

    async getRidesByContractAction(contractId: string) {
      this.loadingData = true;
      try {
        const response: any = await getContractRidesService(contractId);
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        this.rides = normalized.items;
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getDriverRidesAction(driverId: string) {
      this.loadingData = true;
      try {
        const response: any = await getRidesService('');
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        const filtered = normalized.items.filter((ride: any) => {
          const assignedDriverId = ride?.driver?.id;
          return typeof assignedDriverId === 'string' && assignedDriverId === driverId;
        });
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
        const normalized = normalizeRideDetailResponse(response);
        this.capabilities = normalized.capabilities;
        this.ride = normalized.ride;
        this.loadingData = false;
      } catch (error) {
        throw error;
      }
    },
    async getRideByCodeAction(code: string) {
      this.loadingData = true;
      try {
        const response: any = await getRideByCodeService(code);
        const normalized = normalizeRideListResponse(response);
        this.capabilities = normalized.capabilities;
        this.ride = normalized.items?.[0] || null;
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
        const responseData = error?.data ?? error?.response?.data ?? null;
        const message =
          responseData?.message ||
          responseData?.error ||
          error?.message ||
          (typeof error === 'string' ? error : 'Erro desconhecido');

        return {
          success: false,
          error: message,
          statusCode: error?.statusCode || error?.response?.status || 500,
          data: responseData,
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
    async setRideDriverAction(
      rideId: any,
      driverData: any,
      options?: { sendPushNotification?: boolean },
    ) {
      this.loadingSetDriver = true;
      try {
        const newRideData = {
          id: rideId,
          status: 'pending',
          accepted: false,
          driver: {
            id: driverData.id,
            name: driverData.name,
            phone: sanitizePhone(driverData.phone),
            email: driverData.email,
          },
          sendPushNotification: options?.sendPushNotification === true,
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
