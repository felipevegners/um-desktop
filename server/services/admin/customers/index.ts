import { Customer } from "~/types/customer/customer-types";

export const createCustomer = async (customerData: Customer) => {
  try {
    return await $fetch("/api/admin/customers", {
      method: "POST",
      body: customerData,
    });
  } catch (error) {
    console.log("Error during POST -> ", error);
  }
};

export const getCustomers = async (userId: string) => {
  try {
    if (userId) {
      return await $fetch(`/api/admin/customers?id=${userId}`);
    }

    return await $fetch("/api/admin/customers");
  } catch (error) {
    console.log("Error -> ", error);
  }
};

export const updateCustomer = async (customerData: Customer) => {
  try {
    await $fetch("/api/admin/customers", {
      method: "PUT",
      body: customerData,
    });
  } catch (error) {
    console.log("Error Service -> error ");
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    await $fetch("/api/admin/customers", {
      method: "DELETE",
      body: { id },
    });
  } catch (error) {
    console.log("Error -> ", error);
  }
};
