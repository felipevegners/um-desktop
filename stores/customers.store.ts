import { defineStore } from 'pinia';
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from '~/server/services/customers';
import type { Customer } from '~/types/customer/customer-types';

interface ICustomerState {
  customers: Customer[];
  customer: any;
  loading: boolean;
  viewDeleteModal: boolean;
  customerToDelete: {
    id: string;
    name: string;
  };
}

export const useCustomerStore = defineStore('customer', {
  state: (): ICustomerState => {
    return {
      customers: [],
      customer: {},
      loading: false,
      viewDeleteModal: false,
      customerToDelete: { id: '', name: '' },
    };
  },
  actions: {
    async getCustomersAction() {
      try {
        const data = await getCustomers('');
        this.customers = data as any;
      } catch (error) {
        console.log('Store Error -> ', error);
      }
    },
    async getCustomerByIdAction(customerId: string) {
      try {
        const data = await getCustomers(customerId);
        this.customer = data;
        return data;
      } catch (error) {
        console.log('Store Error -> ', error);
      }
    },
    async createNewCustomerAction(customerData: Customer) {
      try {
        await createCustomer(customerData);
      } catch (error) {
        console.log('Store Error Create -> ', error);
      }
    },
    async editCustomer(customerData: any) {
      try {
        await updateCustomer(customerData);
      } catch (error) {
        console.log('Store Error Create -> ', error);
      }
    },
    async deleteCustomerAction(customerId: string) {
      try {
        this.loading = true;
        await deleteCustomer(customerId);
      } catch (error) {
        console.log('Store Error delete -> ', error);
      } finally {
        setTimeout(() => {
          this.loading = false;
          this.viewDeleteModal = false;
          this.customers = this.customers.filter(
            (customer) => customer.id !== customerId,
          );
        }, 2000);
      }
    },
    toggleDeleteModal({ id, name }: any) {
      this.viewDeleteModal = !this.viewDeleteModal;
      this.customerToDelete = {
        id: id,
        name: name,
      };
    },
  },
});
