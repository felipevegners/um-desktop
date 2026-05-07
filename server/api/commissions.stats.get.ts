import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const url = new URL('/commissions/stats', apiBaseUrl);

    return await $fetch(url.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    console.error('[commissions.stats.get] Failed to fetch from um-api:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.data?.message || 'Failed to fetch commissions stats',
    });
  }
});
