import { createError, getRouterParam } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../../../utils/um-api';

export default defineEventHandler(async (event) => {
  const rideId = getRouterParam(event, 'id');
  if (!rideId) {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  const body = await readBody(event);
  const apiBaseUrl = resolveUmApiBaseUrl();
  const discountsUrl = new URL(
    `/rides/${encodeURIComponent(rideId)}/discounts`,
    apiBaseUrl,
  );

  try {
    return await $fetch(discountsUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao aplicar desconto';

    throw createError({ statusCode, statusMessage, data: error?.data });
  }
});
