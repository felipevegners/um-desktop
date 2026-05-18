import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../../utils/um-api';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const payload = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da fatura é obrigatório.',
    });
  }

  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const invoicesUrl = new URL(`/invoices/${id}`, apiBaseUrl);

    return await $fetch(invoicesUrl.toString(), {
      method: 'PATCH',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.response?.status || 500,
      statusMessage: error?.data?.message || error?.message || 'Erro ao atualizar fatura',
      data: error?.data,
    });
  }
});
