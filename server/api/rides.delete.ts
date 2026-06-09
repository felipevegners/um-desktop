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
  const rideByIdUrl = new URL(`/rides/${id}`, apiBaseUrl);

  try {
    await $fetch(rideByIdUrl.toString(), {
      method: 'DELETE',
      headers: await buildUmApiAuthHeaders(event),
    });

    return {
      statusCode: 204,
      message: 'Atendimento removido com sucesso.',
    };
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao remover atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
