import { defineStore } from 'pinia';

export interface IProductState {
  products: any;
  isLoading: boolean;
}

export const useProductsStore = defineStore('products', {
  state: (): IProductState => {
    return {
      products: [],
      isLoading: false,
    };
  },
  actions: {
    async getProductsAction() {
      this.isLoading = true;
      try {
        const response = await $fetch('/api/admin/products');
        this.products = response;
        this.isLoading = false;
      } catch (error) {
        console.log('Error from Store -> ', error);
        throw new Error('Erro ao carregar os produtos', { cause: error });
      }
    },
  },
  getters: {
    enabledProducts(state) {
      return state.products.filter((product: any) => product.enabled === true);
    },
  },
});
