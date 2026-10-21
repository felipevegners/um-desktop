import { createError, getRouterParam } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../../../utils/um-api';

export default defineEventHandler(async (event) => {
  const rideId = getRouterParam(event, 'id');
  if (!rideId) {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const allocationsUrl = new URL(
    `/rides/${encodeURIComponent(rideId)}/allocations`,
    apiBaseUrl,
  );

  try {
    return await $fetch(allocationsUrl.toString(), {
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao calcular valores rateados';

    throw createError({ statusCode, statusMessage, data: error?.data });
  }
});
