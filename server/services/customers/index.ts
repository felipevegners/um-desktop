import { type Customer } from '~/types/customer/customer-types';

export const createCustomer = async (customerData: Customer) => {
  try {
    return await $fetch('/api/customers', {
      method: 'POST',
      body: customerData,
    });
  } catch (error) {
    console.debug('Error during POST -> ', error);
    throw error;
  }
};

export const getCustomers = async (userId: string) => {
  try {
    if (userId) {
      return await $fetch(`/api/customers?id=${userId}`);
    }

    return await $fetch('/api/customers');
  } catch (error) {
    console.debug('Error -> ', error);
    throw error;
  }
};

export const updateCustomer = async (customerData: Customer) => {
  try {
    await $fetch('/api/customers', {
      method: 'PUT',
      body: customerData,
    });
  } catch (error) {
    console.debug('Error Service -> error ');
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    await $fetch('/api/customers', {
      method: 'DELETE',
      body: { id },
    });
  } catch (error) {
    console.debug('Error -> ', error);
    throw error;
  }
};
