export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { locations, departDate, departTime } = body;
  const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
  const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const routesMaskOptions =
    'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

  // Validate input
  if (!Array.isArray(locations) || locations.length < 2) {
    return { statusCode: 400, message: 'locations array of at least 2 required' };
  }

  // Normalization supports string lat,lng, plain address, or {lat, lng}
  const toWaypoint = (wp: any) => {
    if (wp && wp.location && wp.location.latLng) return wp;
    if (typeof wp === 'string' && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(wp.trim())) {
      const [latitude, longitude] = wp.split(',').map(Number);
      return { location: { latLng: { latitude, longitude } } };
    }
    if (typeof wp === 'object' && wp.lat !== undefined && wp.lng !== undefined) {
      return {
        location: { latLng: { latitude: Number(wp.lat), longitude: Number(wp.lng) } },
      };
    }
    if (
      typeof wp === 'object' &&
      wp.coords &&
      wp.coords.lat !== undefined &&
      wp.coords.lng !== undefined
    ) {
      return {
        location: {
          latLng: { latitude: Number(wp.coords.lat), longitude: Number(wp.coords.lng) },
        },
      };
    }
    if (typeof wp === 'object' && wp.address) return { address: wp.address };
    return { address: String(wp) };
  };

  const origin = toWaypoint(locations[0]);
  const destination = toWaypoint(locations[locations.length - 1]);
  const intermediates = locations.slice(1, -1).map(toWaypoint);

  let normalizedDepartTime;
  if (departDate && departTime) {
    const dt = new Date(`${departDate}T${departTime}:00`);
    normalizedDepartTime = dt.toISOString();
  }

  try {
    const data: any = await $fetch(routesUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': API_KEY as string,
        'X-Goog-FieldMask': routesMaskOptions,
      },
      body: {
        origin,
        destination,
        intermediates,
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
        // ...(normalizedDepartTime ? { departureTime: normalizedDepartTime } : {}),
      },
    });
    console.log('CHAMOU!!!!! -> ', body);

    return data?.routes;
  } catch (error) {
    console.error(error);
    throw error;
  }
});
