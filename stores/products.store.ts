import { createProductService, getProductsService } from '@/server/services/products';
import { defineStore } from 'pinia';

export interface IProductState {
  products: any;
  product?: any;
  isLoading: boolean;
}

export const useProductsStore = defineStore('products', {
  state: (): IProductState => {
    return {
      products: [],
      product: {},
      isLoading: false,
    };
  },
  actions: {
    async getProductsAction() {
      this.isLoading = true;
      try {
        const response = await getProductsService('');
        this.products = response;
        this.isLoading = false;
      } catch (error) {
        throw error;
      }
    },
    async getProductByIdAction(productId: string) {
      this.isLoading = true;
      try {
        const response = await getProductsService(productId);
        this.product = response;
        this.isLoading = false;
      } catch (error) {
        throw error;
      }
    },
    async createProductAction(productData: any) {
      this.isLoading = true;
      try {
        return await createProductService(productData);
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
  getters: {
    enabledProducts(state) {
      return state.products.filter((product: any) => product.enabled === true);
    },
  },
});
