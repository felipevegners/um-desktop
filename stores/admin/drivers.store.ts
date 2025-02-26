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
}

export const userDriverStore = defineStore("driver", {
  state: (): IDriversState => {
    return {
      drivers: [],
      driver: {},
      loadingData: false
    };
  },
  actions: {
    async getDriversAction() {
      this.loadingData = true;
      try {
        const data = await getDrivers();
        this.drivers = data as Driver[];
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
        this.driver = data as Driver;
        return data;
      } catch (error) {
        console.log("Driver Store Error -> ", error);
      } finally {
        this.loadingData = false;
      }
    },
    async createNewDriverAction(driverData: Driver) {
      try {
        await createDriver(driverData);
      } catch (error) {
        console.log("Driver Store Error Create -> ", error);
      }
    }
  }
});
