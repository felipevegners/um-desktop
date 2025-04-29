export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { origins, destinations } = query;
  const API_KEY = 'AIzaSyBWGVwrdiUr3IzWGFC713hIzRaNx2fYV4U';
  const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  try {
    const response: any = await $fetch(url, {
      method: 'GET',
      params: {
        origins: origins,
        destinations: destinations,
        mode: 'driving',
        units: 'metric',
        language: 'pt_BR',
        key: API_KEY,
      },
    });
    return response;
  } catch (error) {
    console.error(error);
  }
});
