export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const body = await readBody(event);
  const { origins, destinations } = query;
  const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
  const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const routesMaskOptions =
    'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

  try {
    const data: any = await $fetch(routesUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': API_KEY as string,
        'X-Goog-FieldMask': routesMaskOptions,
      },
      body: {
        origin: {
          address: origins,
        },
        destination: {
          address: destinations,
        },
        intermediates: body,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: 'pt-BR',
        units: 'METRIC',
      },
    });
    return data?.routes;
  } catch (error) {
    console.error(error);
    throw error;
  }
});
