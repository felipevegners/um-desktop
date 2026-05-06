import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  try {
    const payload = await readBody(event);
    const apiBaseUrl = resolveUmApiBaseUrl();
    const commissionsUrl = new URL('/commissions', apiBaseUrl);

    return await $fetch(commissionsUrl.toString(), {
      method: 'POST',
      headers: await buildUmApiAuthHeaders(event),
      body: payload,
    });
  } catch (error: any) {
    console.error('[commissions.post] Failed to create commission:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.data?.message || 'Failed to create commission',
    });
  }
});
