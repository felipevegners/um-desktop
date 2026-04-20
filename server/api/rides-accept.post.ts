import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const rideId = typeof payload?.id === 'string' ? payload.id : '';
  const selectedCar = payload?.selectedCar;

  if (!rideId) {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const acceptUrl = new URL(`/rides/${rideId}/accept`, apiBaseUrl);

  try {
    return await $fetch(acceptUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: {
        selectedCar,
      },
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao aceitar atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
