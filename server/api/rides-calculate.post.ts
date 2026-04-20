import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;

  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const recalculateUrl = new URL(`/rides/${id}/recalculate`, apiBaseUrl);

  try {
    return await $fetch(recalculateUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao recalcular atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
