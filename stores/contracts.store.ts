import type { Contract } from '@/types/contracts/types';
import { defineStore } from 'pinia';
import { getBranchesService } from '~/server/services/branches';
import {
  createContractService,
  deleteContractService,
  getContractsService,
  updateContractService,
} from '~/server/services/contracts';

interface IContractsState {
  contracts?: any;
  inactiveContracts?: any;
  contract?: Contract | any;
  contractBranches?: any;
  contractId?: string;
  isLoading: boolean | any;
}

export const useContractsStore = defineStore('contracts', {
  state: (): IContractsState => {
    return {
      contracts: [],
      inactiveContracts: [],
      contract: {},
      contractBranches: [],
      contractId: '',
      isLoading: false,
    };
  },
  actions: {
    async getContractsAction() {
      this.isLoading = true;
      try {
        const data = await getContractsService('');
        this.contracts = (data as any).filter(
          (contract: any) => contract.enabled === true,
        );
        this.inactiveContracts = (data as any).filter(
          (contract: any) => contract.enabled === false,
        );
        this.isLoading = false;
      } catch (error) {
        console.error('Store GET All Error -> ', error);
        throw error;
      }
    },
    async getContractByIdAction(contractId: string) {
      this.isLoading = true;
      try {
        const data = await getContractsService(contractId);
        this.contract = { ...(data as any) };
        this.isLoading = false;
      } catch (error) {
        console.error('Store GET by ID Error -> ', error);
        throw error;
      }
    },
    async createContractAction(contractData: any) {
      try {
        const newContract = await createContractService(contractData);
        //@ts-ignore
        this.contractId = newContract?.id;
      } catch (error) {
        console.error('Error from Store -> ', error);
        throw error;
      }
    },
    async updateContractAction(dataToUpdate: any) {
      try {
        await updateContractService(dataToUpdate);
      } catch (error) {
        console.error('Error from Store -> ', error);
        throw error;
      }
    },
    async deleteContractAction(contractId: any) {
      this.isLoading = true;
      try {
        await deleteContractService(contractId);
        this.isLoading = false;
      } catch (error) {
        console.error('Error from Store -> ', error);
        throw new Error();
      }
    },
  },
});
