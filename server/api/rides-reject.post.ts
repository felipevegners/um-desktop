import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const rideId = typeof payload?.id === 'string' ? payload.id : '';
  const reason = String(payload?.reason || '').trim();
  const accepted = typeof payload?.accepted === 'boolean' ? payload.accepted : undefined;
  const driver =
    payload?.driver && typeof payload.driver === 'object' ? payload.driver : undefined;

  if (!rideId) {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  if (!reason) {
    throw createError({ statusCode: 400, statusMessage: 'Reason is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const rejectUrl = new URL(`/rides/${rideId}/reject`, apiBaseUrl);
  const rideByIdUrl = new URL(`/rides/${rideId}`, apiBaseUrl);

  try {
    const authHeaders = await buildUmApiAuthHeaders(event);

    const rejectResponse = await $fetch(rejectUrl.toString(), {
      method: 'POST',
      headers: authHeaders,
      body: {
        reason,
        ...(accepted !== undefined ? { accepted } : {}),
        ...(driver ? { driver } : {}),
      },
    });

    // Some API environments ignore optional fields in /reject; enforce cleanup with PATCH.
    // If PATCH is forbidden for the driver token, keep reject successful.
    if (accepted !== undefined || driver) {
      try {
        await $fetch(rideByIdUrl.toString(), {
          method: 'PATCH',
          headers: authHeaders,
          body: {
            ...(accepted !== undefined ? { accepted } : {}),
            ...(driver ? { driver } : {}),
          },
        });
      } catch (patchError: any) {
        const patchStatusCode =
          patchError?.statusCode || patchError?.response?.status || 500;

        if (patchStatusCode !== 403) {
          throw patchError;
        }

        console.warn('[rides-reject] Driver cleanup PATCH skipped due to forbidden');
      }
    }

    return rejectResponse;
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao recusar atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
