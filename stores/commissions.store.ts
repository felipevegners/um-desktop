import { defineStore } from 'pinia';
import {
  batchPayCommissionsService,
  createCommissionService,
  deleteCommissionService,
  getCommissionsService,
  getCommissionsStatsService,
  updtateCommissionService,
} from '~/server/services/commissions';

export interface ICommissionsStats {
  total: number;
  totalAmount: number;
  paid: number;
  paidAmount: number;
  pending: number;
  pendingAmount: number;
}

export interface ICommissionsState {
  commissions: any;
  commission: any;
  stats: ICommissionsStats;
  isLoading: boolean;
  isUpdating: boolean;
}

export const useCommissionsStore = defineStore('commissions', {
  state: (): ICommissionsState => {
    return {
      commissions: [],
      commission: {},
      stats: {
        total: 0,
        totalAmount: 0,
        paid: 0,
        paidAmount: 0,
        pending: 0,
        pendingAmount: 0,
      },
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
      } catch (error) {
        console.debug(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async getCommissionByIdAction(commissionId: string) {
      this.isLoading = true;
      try {
        const response = await getCommissionsService(commissionId);
        this.commission = response;
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async getCommissionsStatsAction() {
      try {
        const response = await getCommissionsStatsService();
        this.stats = response as ICommissionsStats;
      } catch (error) {
        console.debug(error);
      }
    },
    async batchPayCommissionsAction(ids: string[]) {
      this.isUpdating = true;
      try {
        return await batchPayCommissionsService(ids);
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
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
