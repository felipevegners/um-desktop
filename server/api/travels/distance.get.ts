export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { origins, destinations, waypoints } = query;
  const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
  const distanceUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  try {
    const response: any = await $fetch(distanceUrl, {
      method: 'GET',
      params: {
        origins: origins,
        destinations: destinations,
        waypoints: waypoints,
        mode: 'driving',
        units: 'metric',
        language: 'pt_BR',
        key: API_KEY,
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
});
