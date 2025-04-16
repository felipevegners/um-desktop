import {
  createBranchService,
  deleteBranchService,
  getBranchesService,
  updateBranchService,
} from '@/server/services/admin/branches';
import { defineStore } from 'pinia';

export interface IBranchState {
  branches: any[];
  branch: Record<any, any>;
  inactiveBranches: any[];
  isLoadingData: boolean;
}

export const useBranchesStore = defineStore('braches', {
  state: (): IBranchState => {
    return {
      branches: [],
      branch: {},
      inactiveBranches: [],
      isLoadingData: false,
    };
  },
  actions: {
    async getBranchesAction() {
      this.isLoadingData = true;
      try {
        const response = await getBranchesService();
        this.branches = response as any;
      } catch (error) {
        console.log('Erro from GET store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },

    async getBranchByIdAction(branchId: string) {
      this.isLoadingData = true;
      try {
        const response = await getBranchesService(branchId);
        this.branch = response as any;
      } catch (error) {
        console.log('Error from GET by ID store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },

    async createBranchAction(branchData: any) {
      this.isLoadingData = true;
      try {
        await createBranchService(branchData);
      } catch (error) {
        console.log('Error from create store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },
    async updateBranchAction(branchData: any) {
      this.isLoadingData = true;
      try {
        await updateBranchService(branchData);
      } catch (error) {
        console.log('Error from update store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },
    async deleteBranchAction(branchId: string) {
      this.isLoadingData = true;
      try {
        await deleteBranchService(branchId);
      } catch (error) {
        console.log('Error from delete store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },
  },
});
