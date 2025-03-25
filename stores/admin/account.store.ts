import {
  createUserAccountService,
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
      isLoggedIn: false,
    };
  },
  actions: {
    async getUsersAccountsAction() {
      try {
        const data = await getUsersAccountsService('');
        this.accounts = data as any;
      } catch (error) {
        console.log('Error durging user register -> ', error);
      }
    },
    async getUsersAccountsByIdAction(accountId: string) {
      try {
        const data = await getUsersAccountsService(accountId);
        console.log('data user -> ', data);
        this.userAccount = data as any;
      } catch (error) {
        console.log('Error durging user register -> ', error);
      }
    },
    async registerUserAccountAction(accountData: any) {
      this.isLoadingSend = true;
      try {
        await createUserAccountService(accountData);
      } catch (error) {
        console.log('Error durging user register -> ', error);
      } finally {
        this.isLoadingSend = false;
      }
    },
  },
});
