import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const invoicesUrl = new URL('/invoices', apiBaseUrl);

    return await $fetch(invoicesUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.response?.status || 500,
      statusMessage: error?.data?.message || error?.message || 'Erro ao criar fatura',
      data: error?.data,
    });
  }
});
