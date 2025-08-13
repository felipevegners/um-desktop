import {
  createUserAccountService,
  deleteUserAccountService,
  getUsersAccountsService,
  updateUserAccountService,
} from '@/server/services/accounts';
import { defineStore } from 'pinia';

export type Account = {};
export interface IAccountsState {
  isLoadingSend: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  accounts: Account[];
  account: any;
}

export const useAccountStore = defineStore('accounts', {
  state: () => {
    return {
      accounts: [],
      inactiveAccounts: [],
      account: {
        id: '',
        username: '',
        email: '',
        birthDate: '',
        role: '',
        phone: '',
        position: '',
        department: '',
        contract: {
          contractId: '',
          branchId: '',
          area: '',
          name: '',
        },
        address: {
          zipcode: '',
          streetName: '',
          streetNumber: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
        status: '',
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
        const data = await getUsersAccountsService('', '');
        this.accounts = (data as any).filter((account: any) => account.enabled === true);
        this.inactiveAccounts = (data as any).filter(
          (account: any) => account.enabled === false,
        );
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
        const data = await getUsersAccountsService(accountId, '');
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
        const newAccount = await createUserAccountService(accountData);
        return newAccount;
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
