import {
  createContractService,
  deleteContractService,
  getContractsService,
  updateContractService,
} from '@/server/services/admin/contracts';
import type { Contract } from '@/types/contracts/types';
import { defineStore } from 'pinia';

interface IContractsState {
  contracts?: any;
  inactiveContracts?: any;
  contract?: Contract | any;
  contractId?: string;
  isLoading: boolean | any;
}

export const useContractsStore = defineStore('contracts', {
  state: (): IContractsState => {
    return {
      contracts: [],
      inactiveContracts: [],
      contract: {},
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
        console.log('Store GET All Error -> ', error);
      }
    },
    async getContractByIdAction(contractId: string) {
      this.isLoading = true;
      try {
        const data = await getContractsService(contractId);
        this.contract = { ...(data as any) };
        this.isLoading = false;
      } catch (error) {
        console.log('Store GET by ID Error -> ', error);
      }
    },
    async createContractAction(contractData: any) {
      try {
        const newContract = await createContractService(contractData);
        //@ts-ignore
        this.contractId = newContract?.id;
      } catch (error) {
        console.log('Error from Store -> ', error);
        throw error;
      }
    },
    async updateContractAction(dataToUpdate: any) {
      try {
        await updateContractService(dataToUpdate);
      } catch (error) {
        console.log('Error from Store -> ', error);
        throw error;
      }
    },
    async deleteContractAction(contractId: any) {
      this.isLoading = true;
      try {
        await deleteContractService(contractId);
        this.isLoading = false;
      } catch (error) {
        console.log('Error from Store -> ', error);
        return error;
      }
    },
  },
});
