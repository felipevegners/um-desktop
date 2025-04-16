import {
  createUserAccountService,
  deleteUserAccountService,
  getUsersAccountsService,
} from '@/server/services/accounts';
import { defineStore } from 'pinia';

export const useAccountStore = defineStore('accounts', {
  state: () => {
    return {
      accounts: [],
      userAccount: {
        id: '',
        name: '',
        email: '',
        role: '',
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
        console.log('data user -> ', data);
        this.userAccount = data as any;
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
