import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

type InvoiceQuery = {
  id?: string;
  number?: string;
  status?: string;
  contractId?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<InvoiceQuery>(event);

  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const invoicesUrl = new URL('/invoices', apiBaseUrl);

    if (query.id) {
      invoicesUrl.searchParams.set('id', query.id);
    }

    if (query.number) {
      invoicesUrl.searchParams.set('number', query.number);
    }

    if (query.status) {
      invoicesUrl.searchParams.set('status', query.status);
    }

    if (query.contractId) {
      invoicesUrl.searchParams.set('contractId', query.contractId);
    }

    return await $fetch(invoicesUrl.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.response?.status || 500,
      statusMessage:
        error?.data?.message || error?.message || 'Erro ao buscar os fechamentos',
      data: error?.data,
    });
  }
});
