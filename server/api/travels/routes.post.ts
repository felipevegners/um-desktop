import { createError } from 'h3';

import { resolveUmApiBaseUrl } from '../../utils/um-api';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { locations, departureTime } = body;

  const config = useRuntimeConfig();
  const ENABLE_DIRECTIONS =
    String(
      config.public?.UM_DESKTOP_ENABLE_DIRECTIONS ??
        process.env.UM_DESKTOP_ENABLE_DIRECTIONS ??
        'false',
    ) === 'true';

  // Short-circuit when directions are disabled via runtime config to avoid
  // making expensive external calls during tests or while the feature is off.
  if (!ENABLE_DIRECTIONS) {
    // eslint-disable-next-line no-console
    console.debug('Directions disabled (desktop flag not true), returning empty array', {
      ENABLE_DIRECTIONS,
    });
    return [];
  }

  // Proxy to configured um-api (server-side) rather than calling Google directly
  const runtimeBase =
    (config.public.PUBLIC_API_BASE_URL as string) || process.env.PUBLIC_API_BASE_URL;
  const base = runtimeBase || resolveUmApiBaseUrl();
  const url = `${base.replace(/\/$/, '')}/travels/routes`;

  // Log the resolved target for easier debugging in dev
  // eslint-disable-next-line no-console
  console.debug('Proxying /api/travels/routes to', { base, url, ENABLE_DIRECTIONS });

  try {
    const data: any = await $fetch(url, {
      method: 'POST',
      body: { locations, departureTime },
      headers: {
        'X-UM-CLIENT': 'um-desktop',
      },
    });
    return data;
  } catch (error: any) {
    // Log error details for server-side debugging
    console.error('Failed proxying routes to um-api', {
      url,
      status: error?.status || error?.response?.status,
      message: error?.data?.message || error?.message || String(error),
      error,
    });
    // normalize error to provide useful message to client
    throw createError({
      statusCode: error?.status || 502,
      statusMessage:
        error?.data?.message || error?.message || 'Failed proxying routes to um-api',
    });
  }
});
