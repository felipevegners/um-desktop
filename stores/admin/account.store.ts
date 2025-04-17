import {
  createUserAccountService,
  deleteUserAccountService,
  getUsersAccountsService,
  updateUserAccountService,
} from '@/server/services/accounts';
import { defineStore } from 'pinia';

export const useAccountStore = defineStore('accounts', {
  state: () => {
    return {
      accounts: [],
      account: {
        enabled: true,
      },
      isLoadingSend: false,
      isLoading: false,
      isLoggedIn: false,
    };
  },
  actions: {
    async getUsersAccountsAction() {
      this.isLoading = true;
      try {
        const data = await getUsersAccountsService('');
        this.accounts = data as any;
      } catch (error) {
        console.log('Error durging user register -> ', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async getUsersAccountsByIdAction(accountId: string) {
      this.isLoading = true;
      try {
        const data = await getUsersAccountsService(accountId);
        this.account = data as any;
      } catch (error) {
        console.log('Error durging user register -> ', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async registerUserAccountAction(accountData: any) {
      this.isLoadingSend = true;
      try {
        await createUserAccountService(accountData);
      } catch (error) {
        console.log('Error durging user register -> ', error);
        throw error;
      } finally {
        this.isLoadingSend = false;
      }
    },

    async updateUserAccountAction(accountData: any) {
      this.isLoadingSend = true;
      try {
        await updateUserAccountService(accountData);
      } catch (error) {
        console.log('Error durging user update -> ', error);
        throw error;
      } finally {
        this.isLoadingSend = false;
      }
    },

    async deleteUserAccountAction(accountId: string) {
      this.isLoadingSend = true;
      try {
        await deleteUserAccountService(accountId);
      } catch (error) {
        console.log('Error durging user delete -> ', error);
        throw error;
      } finally {
        this.isLoadingSend = false;
      }
    },
  },
});
