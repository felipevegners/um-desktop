import { createError, getHeader } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const apiBaseUrl = resolveUmApiBaseUrl();
  const rideUrl = new URL('/rides', apiBaseUrl);

  const headerIdempotencyKey = getHeader(event, 'x-idempotency-key');
  const bodyIdempotencyKey =
    typeof payload?.idempotencyKey === 'string' && payload.idempotencyKey.length > 0
      ? payload.idempotencyKey
      : undefined;

  const idempotencyKey =
    typeof headerIdempotencyKey === 'string' && headerIdempotencyKey.length > 0
      ? headerIdempotencyKey
      : bodyIdempotencyKey;

  try {
    return await $fetch(rideUrl.toString(), {
      method: 'POST',
      headers: {
        ...(await buildUmApiAuthHeaders(event)),
        ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
      },
      body: payload,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao criar atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
