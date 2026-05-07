import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  try {
    const payload = await readBody(event);
    const apiBaseUrl = resolveUmApiBaseUrl();
    const url = new URL('/commissions/batch-pay', apiBaseUrl);

    return await $fetch(url.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    console.error('[commissions.batch-pay.post] Failed to batch pay commissions:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.data?.message || 'Failed to batch pay commissions',
    });
  }
});
