import { Prisma, prisma } from '~/utils/prisma';

import { getRideRoutesService } from '../services/rides';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;
  try {
    const ride: any = await prisma.rides.findUnique({
      where: {
        id: id,
      },
    });

    if (ride && ride.progress.rideTracking.length) {
      const stopsLocations = ride.progress.stops.map((stop: any) => {
        return {
          lat: stop.location.latitude,
          lng: stop.location.longitude,
        };
      });
      const locations = [
        {
          lat: ride.progress.startLocation.latitude,
          lng: ride.progress.startLocation.longitude,
        },
        ...stopsLocations,
        {
          lat: ride.progress.finishedLocation.latitude,
          lng: ride.progress.finishedLocation.longitude,
        },
      ];
      const departDate = ride.progress.started;
      const departTime = ride.progress.departTime;

      try {
        const routeCalculation = await getRideRoutesService({
          locations,
          departDate,
          departTime,
        });

        const normalizedDuration = routeCalculation[0].duration.replace('s', '');
        const etaDuration = ride.travel.estimatedDuration; // in seconds
        const etaDistance = ride.travel.estimatedDistance; // in meters
        const realDuration = Math.ceil(normalizedDuration); // in seconds
        const realDistance = routeCalculation[0].distanceMeters; // in meters
        const totalTimeStopped =
          ride.progress.stops.reduce((acc: any, curr: any) => {
            return acc + curr.totalStopInMinutes;
          }, 0) * 60;
        const { basePrice, kmPrice, minutePrice } = ride.product;

        const finalDuration = Math.max(realDuration, etaDuration) + totalTimeStopped; // in seconds
        const finalDistance = Math.max(realDistance, etaDistance); // in meters

        const finalKmPrice =
          parseFloat(basePrice) + parseFloat(kmPrice) * (finalDistance / 1000);
        const finalDurationPrice = parseFloat(minutePrice) * (finalDuration / 60);
        const rideFinalPrice = finalKmPrice + finalDurationPrice;

        const finalPolyline = routeCalculation[0].polyline.encodedPolyline;

        const finalTravelData = {
          ...ride.travel,
          finalDuration,
          finalDistance,
          totalTimeStopped,
          finalPolyline,
        };

        await prisma.rides.update({
          where: {
            id: ride.id,
          },
          data: {
            rideFinalPrice: rideFinalPrice.toFixed(2),
            travel: finalTravelData,
          },
        });

        return ride;
      } catch (error) {
        console.error('ERROR RIDE CALCULATION API ->', error);
      } finally {
        console.log('RIDE CALCULATED');
      }
    } else {
      return;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
        return new Error(error.message);
      }
    }
    throw error;
  }
});
