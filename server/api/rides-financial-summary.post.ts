import { createError, readBody } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody<{ rideIds: string[] }>(event);
  const apiBaseUrl = resolveUmApiBaseUrl();
  const summaryUrl = new URL('/rides/financial-summary', apiBaseUrl);

  try {
    return await $fetch(summaryUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message ||
      error?.statusMessage ||
      'Erro ao resumir valores dos atendimentos';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
