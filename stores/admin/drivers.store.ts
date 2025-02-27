import { defineStore } from "pinia";

import {
  getDrivers,
  createDriver,
  getDriver
} from "~/server/services/admin/drivers";

import type { Driver } from "~/types/drivers/driver-types";

interface IDriversState {
  drivers: Driver[];
  driver: any;
  loadingData: boolean;
  loadingSend: boolean;
}

export const userDriverStore = defineStore("driver", {
  state: (): IDriversState => {
    return {
      drivers: [],
      driver: {},
      loadingData: false,
      loadingSend: false
    };
  },
  actions: {
    async getDriversAction() {
      this.loadingData = true;
      try {
        const data = await getDrivers();
        this.drivers = data as any;
      } catch (error) {
        console.log("Driver Store Error -> ", error);
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
        console.log("Driver Store Error -> ", error);
      } finally {
        this.loadingData = false;
      }
    },
    async createNewDriverAction(driverData: Driver) {
      this.loadingSend = true;
      try {
        await createDriver(driverData);
      } catch (error) {
        console.log("Driver Store Error Create -> ", error);
      } finally {
        this.loadingSend = false;
      }
    }
  }
});
