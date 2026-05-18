import { defineStore } from 'pinia';
import {
  createInvoiceService,
  getInvoicesService,
  updateInvoiceService,
} from '~/server/services/invoices';

interface InvoicesState {
  invoices: any[];
  invoice: any | null;
  isLoading: boolean;
  isUpdating: boolean;
}

export const useInvoicesStore = defineStore('invoices', {
  state: (): InvoicesState => ({
    invoices: [],
    invoice: null,
    isLoading: false,
    isUpdating: false,
  }),
  actions: {
    async getInvoicesAction(query?: Record<string, string | number | boolean>) {
      this.isLoading = true;
      try {
        const response: any = await getInvoicesService(undefined, query);
        this.invoices = Array.isArray(response) ? response : [];
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async getInvoiceByIdAction(invoiceId: string) {
      this.isLoading = true;
      try {
        this.invoice = await getInvoicesService(invoiceId);
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async createInvoiceAction(payload: any) {
      this.isUpdating = true;
      try {
        const created = await createInvoiceService(payload);
        return created;
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
    async updateInvoiceAction(invoiceId: string, payload: any) {
      this.isUpdating = true;
      try {
        const updated = await updateInvoiceService(invoiceId, payload);
        this.invoice = updated;
        this.invoices = this.invoices.map((item: any) =>
          item?.id === invoiceId ? updated : item,
        );
        return updated;
      } catch (error) {
        throw error;
      } finally {
        this.isUpdating = false;
      }
    },
  },
});
