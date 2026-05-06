import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const query = getQuery(event) as Record<string, string | undefined>;

    const commissionsUrl = new URL('/commissions', apiBaseUrl);

    // Forward query params
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v) !== '') {
        commissionsUrl.searchParams.set(k, String(v));
      }
    }

    return await $fetch(commissionsUrl.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    console.error('[commissions.get] Failed to fetch from um-api:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.data?.message || 'Failed to fetch commissions',
    });
  }
});
