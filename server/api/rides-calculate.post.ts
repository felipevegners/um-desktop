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

    if (ride) {
      const locations = [
        {
          lat: ride.progress.startLocation.latitude,
          lng: ride.progress.startLocation.longitude,
        },
        ...ride.progress.stops.map((wp: any) => {
          return {
            lat: wp.location.latitude,
            lng: wp.location.longitude,
          };
        }),
        {
          lat: ride.progress.finishedLocation.latitude,
          lng: ride.progress.finishedLocation.longitude,
        },
      ];
      // const departDate = ride.progress.started;
      // const departTime = ride.progress.departTime;

      try {
        const routeCalculation = await getRideRoutesService({
          locations,
        });
        // await prisma.rides.update({
        //   where: {
        //     id: ride.id,
        //   },
        //   data: {
        //     progress: {
        //       // finalPolyline: generatedFinalPolyline,
        //       totalTimeStopped: totalStoppedInMinutes,
        //     },
        //   },
        // });
        const totalStoppedInMinutes = ride?.progress?.stops?.reduce(
          (acc: number, curr: any) => acc + curr.totalStopInMinutes,
          0,
        );
        console.log('ROUTE FINAL CALCULATION -> ', routeCalculation);
        console.log('TOTAL STOPED -> ', totalStoppedInMinutes);
        return { routeCalculation, totalStoppedInMinutes };
      } catch (error) {
        console.error(error);
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
