import {
  createContractService,
  getContractsService,
  updateContractService,
} from '@/server/services/contracts';
import type { Contract } from '@/types/contracts/types';
import { defineStore } from 'pinia';

interface IContractsState {
  contracts?: any;
  inactiveContracts?: any;
  contract?: Contract | any;
  contractId?: string;
  isLoading: boolean;
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
          (contract: any) => contract.status !== 'inactive',
        );
        this.inactiveContracts = (data as any).filter(
          (contract: any) => contract.status === 'inactive',
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
        this.contract = { ...data };
        this.isLoading = false;
      } catch (error) {
        console.log('Store GET by ID Error -> ', error);
      }
    },
    async createContractAction(contractData: any) {
      try {
        const newContract = await createContractService(contractData);
        this.contractId = newContract?.id;
      } catch (error) {
        console.log('Error from Store -> ', error);
      }
    },
    async createMasterManagerAction(managerData: any) {
      try {
        const newManager = await createContractService(managerData);
        console.log('New Manager -> ', newManager);
      } catch (error) {
        console.log('Error from Store -> ', error);
      }
    },
    async updateContractAction(dataToUpdate: any) {
      try {
        await updateContractService(dataToUpdate);
      } catch (error) {
        console.log('Error from Store -> ', error);
      }
    },
  },
});
