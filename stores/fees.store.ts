import { defineStore } from 'pinia';
import {
  createFeeService,
  deleteFeeService,
  getFeesService,
  updtateFeeService,
} from '~/server/services/fees';

export interface IFeesState {
  fees: any;
  fee: any;
  isLoading: boolean;
  isUpdating: boolean;
}

export const useFeeStore = defineStore('fees', {
  state: (): IFeesState => {
    return {
      fees: [],
      fee: {},
      isLoading: false,
      isUpdating: false,
    };
  },
  actions: {
    async getFeesAction() {
      this.isLoading = true;
      try {
        const response = await getFeesService('');
        this.fees = response;
      } catch (error) {
        console.debug(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async getFeeByTypeAction(feeType: string) {
      this.isLoading = true;
      try {
        const response = await getFeesService(feeType);
        this.fee = response;
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async createFeeAction(feeData: any) {
      this.isLoading = true;
      try {
        return await createFeeService(feeData);
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateFeeAction(feeData: any) {
      this.isUpdating = true;
      try {
        return await updtateFeeService(feeData);
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
    async deleteFeeAction(feeData: any) {
      this.isLoading = true;
      try {
        return await deleteFeeService(feeData);
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },

  getters: {
    ebabledFees(state) {
      return state.fees.filter((fee: any) => fee.enabled === true);
    },
  },
});
