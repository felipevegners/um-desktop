// Utility to build a Google Maps Distance Matrix API payload from UM Desktop ride detail objects
// Usage: import { buildDistanceMatrixPayload } from './maps';

export function buildDistanceMatrixPayload({ originCoords, waypointLocationDetails, destinationCoords }) {
  // Convert to strings as required by Google Maps API
  const origins = [`${originCoords.lat},${originCoords.lng}`];
  // Each stop and the destination are destinations
  const stops = (waypointLocationDetails || []).map(wp => (wp.coords ? `${wp.coords.lat},${wp.coords.lng}` : ''));
  const destinations = [...stops, `${destinationCoords.lat},${destinationCoords.lng}`].filter(Boolean);

  return {
    origins,
    destinations
  };
}

/*
Example:

buildDistanceMatrixPayload({
  originCoords: { lat: -23.6, lng: -46.7 },
  waypointLocationDetails: [
    { coords: { lat: -23.61, lng: -46.71 } },
    { coords: { lat: -23.62, lng: -46.72 } },
  ],
  destinationCoords: { lat: -23.63, lng: -46.73 }
})
// returns:
// {
//   origins: ['-23.6,-46.7'],
//   destinations: ['-23.61,-46.71', '-23.62,-46.72', '-23.63,-46.73']
// }
*/
