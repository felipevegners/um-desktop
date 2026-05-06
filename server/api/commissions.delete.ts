import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  try {
    const payload = await readBody(event);
    const { id } = payload;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Commission id is required',
      });
    }

    const apiBaseUrl = resolveUmApiBaseUrl();
    const commissionsUrl = new URL(`/commissions/${id}`, apiBaseUrl);

    return await $fetch(commissionsUrl.toString(), {
      method: 'DELETE',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    console.error('[commissions.delete] Failed to delete commission:', error);
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.data?.message || 'Failed to delete commission',
    });
  }
});
