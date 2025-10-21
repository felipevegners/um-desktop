import { defineStore } from 'pinia';
import {
  createCommissionService,
  deleteCommissionService,
  getCommissionsService,
  updtateCommissionService,
} from '~/server/services/commissions';

export interface ICommissionsState {
  commissions: any;
  commission: any;
  isLoading: boolean;
  isUpdating: boolean;
}

export const useCommissionsStore = defineStore('commissions', {
  state: (): ICommissionsState => {
    return {
      commissions: [],
      commission: {},
      isLoading: false,
      isUpdating: false,
    };
  },
  actions: {
    async getCommissionsAction() {
      this.isLoading = true;
      try {
        const response = await getCommissionsService('');
        this.commissions = response;
        this.isLoading = false;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    async getCommissionByIdAction(commissionId: string) {
      this.isLoading = true;
      try {
        const response = await getCommissionsService(commissionId);
        this.commission = response;
        this.isLoading = false;
      } catch (error) {
        throw error;
      }
    },
    async createCommistionAction(commissionData: any) {
      this.isUpdating = true;
      try {
        return await createCommissionService(commissionData);
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
    async updateCommissionAction(commissionData: any) {
      this.isUpdating = true;
      try {
        return await updtateCommissionService(commissionData);
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
    async deleteCommissionAction(commissionData: any) {
      this.isUpdating = true;
      try {
        return await deleteCommissionService(commissionData);
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
  },
});
