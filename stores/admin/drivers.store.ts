import { defineStore } from 'pinia';
import {
  createDriver,
  deleteDriver,
  getDriver,
  getDrivers,
  updateDriver,
} from '~/server/services/admin/drivers';
import type { Driver } from '~/types/drivers/driver-types';

interface IDriversState {
  drivers: Driver[];
  inactiveDrivers: Driver[];
  driver: any;
  loadingData: boolean;
  loadingSend: boolean;
}

export const userDriverStore = defineStore('driver', {
  state: (): IDriversState => {
    return {
      drivers: [],
      driver: {},
      inactiveDrivers: [],
      loadingData: false,
      loadingSend: false,
    };
  },
  actions: {
    async getDriversAction() {
      this.loadingData = true;
      try {
        const data = await getDrivers();
        this.drivers = (data as any).filter((driver: Driver) => driver.enabled === true);
        this.inactiveDrivers = (data as any).filter(
          (driver: Driver) => driver.enabled === false,
        );
      } catch (error) {
        console.log('Driver Store Error -> ', error);
        throw error;
      } finally {
        this.loadingData = false;
      }
    },
    async getDriverByIdAction(driverId: string) {
      this.loadingData = true;
      try {
        const data = await getDriver(driverId);
        this.driver = data as unknown;
        return data;
      } catch (error) {
        console.log('Driver Store Error -> ', error);
        throw error;
      } finally {
        this.loadingData = false;
      }
    },
    async createNewDriverAction(driverData: Driver) {
      this.loadingSend = true;
      try {
        await createDriver(driverData);
      } catch (error) {
        console.log('Driver Store Error Create -> ', error);
        throw error;
      } finally {
        this.loadingSend = false;
      }
    },
    async updateDriverAction(driverData: Driver) {
      this.loadingSend = true;
      try {
        await updateDriver(driverData);
      } catch (error) {
        console.log('Driver Store Error Update -> ', error);
        throw error;
      } finally {
        this.loadingSend = false;
      }
    },

    async deleteDriverAction(driverId: string) {
      this.loadingSend = true;
      try {
        await deleteDriver(driverId);
      } catch (error) {
        console.log('Driver Store Error Delete -> ', error);
        throw error;
      } finally {
        this.drivers = this.drivers.filter((driver) => driver.id !== driverId);
        setTimeout(() => {
          this.loadingSend = false;
        }, 1000);
      }
    },
  },
});
