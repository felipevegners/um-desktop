import { createError, readBody } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const apiBaseUrl = resolveUmApiBaseUrl();
  const allocationsUrl = new URL('/rides/allocations', apiBaseUrl);

  try {
    return await $fetch(allocationsUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao calcular rateio';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
