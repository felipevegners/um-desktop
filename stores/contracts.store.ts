import { createContractService } from '@/server/services/contracts';
import { prisma } from '@/utils/prisma';
import { defineStore } from 'pinia';

export const useContractsStore = defineStore('contracts', {
  state: () => {
    return {
      contracts: [],
      contract: {},
      isLoading: false,
    };
  },
  actions: {
    async createContractAction(contractData: any) {
      try {
        const newContract = await createContractService(contractData);
        console.log('New contract -> ', newContract);
      } catch (error) {
        console.log('Error from Store -> ', error);
      }
    },
  },
});
