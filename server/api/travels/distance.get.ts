export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { origins, destinations, waypoints } = query;

  // Proxy to configured um-api rather than calling Google directly from the client
  const config = useRuntimeConfig();
  const base =
    (config.public.PUBLIC_API_BASE_URL as string) || process.env.PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('PUBLIC_API_BASE_URL is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/travels/distance`;

  try {
    const response: any = await $fetch(url, {
      method: 'GET',
      params: {
        origins,
        destinations,
        waypoints,
      },
    });
    return response;
  } catch (error) {
    console.error('Failed proxying distance to um-api', error);
    throw error;
  }
});
