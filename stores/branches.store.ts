import { defineStore } from 'pinia';
import {
  createBranchService,
  deleteBranchService,
  getBranchesService,
  updateBranchService,
} from '~/server/services/branches';

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
        const data: any = await getBranchesService();
        this.branches = data.filter((branch: any) => branch.enabled === true);
        this.inactiveBranches = data.filter((branch: any) => branch.enabled === false);
      } catch (error) {
        console.error('Erro from GET store --> ', error);
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
        console.error('Error from GET by ID store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },

    async createBranchAction(branchData: any) {
      this.isLoadingData = true;
      try {
        await createBranchService(branchData);
        return { success: true };
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Erro desconhecido';
        return {
          success: false,
          error: message,
          statusCode: error?.statusCode || 500,
        };
      } finally {
        this.isLoadingData = false;
      }
    },
    async updateBranchAction(branchData: any) {
      this.isLoadingData = true;
      try {
        await updateBranchService(branchData);
        return { success: true };
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Erro desconhecido';
        return {
          success: false,
          error: message,
          statusCode: error?.statusCode || 500,
        };
      } finally {
        this.isLoadingData = false;
      }
    },
    async deleteBranchAction(branchId: string) {
      this.isLoadingData = true;
      try {
        await deleteBranchService(branchId);
      } catch (error) {
        console.error('Error from delete store --> ', error);
        throw error;
      } finally {
        this.isLoadingData = false;
      }
    },
  },
});
