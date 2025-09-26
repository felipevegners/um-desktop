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

    if (ride && ride.progress.actualLocation.length) {
      const lastLocationIndex = ride.progress.actualLocation.length - 1;
      const middleLoactions = ride.progress.actualLocation.slice(
        0,
        lastLocationIndex - 1,
      );
      const locations = [
        ...middleLoactions.map((wp: any) => {
          return {
            lat: wp.latitude,
            lng: wp.longitude,
          };
        }),
        {
          lat: ride.progress.actualLocation[lastLocationIndex].latitude,
          lng: ride.progress.actualLocation[lastLocationIndex].longitude,
        },
      ];
      // const departDate = ride.progress.started;
      // const departTime = ride.progress.departTime;

      try {
        const routeCalculation = await getRideRoutesService({
          locations,
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

        // const calculatedRideData = {
        //   realDuration,
        //   realDistance,
        //   totalTimeStopped,
        //   finalDuration,
        //   finalDistance,
        //   rideFinalPrice,
        // };

        const finalTravelData = {
          ...ride.travel,
          finalDuration,
          finalDistance,
          totalTimeStopped,
          rideFinalPrice,
        };

        await prisma.rides.update({
          where: {
            id: ride.id,
          },
          data: {
            travel: finalTravelData,
          },
        });

        return finalTravelData;
      } catch (error) {
        console.error('ERROR API ->', error);
      }
    }

    return ride;
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
