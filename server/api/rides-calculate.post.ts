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
      const stopsLocations = ride?.progress?.stops?.map((stop: any) => {
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
      const time = new Date(ride?.progress?.finishedAt);
      time.setHours(time.getHours() + 3);

      try {
        const routeCalculation = await getRideRoutesService({
          locations,
          departureTime: time.toISOString(),
        });

        const normalizedDuration = routeCalculation[0]?.duration.replace('s', '');
        const etaDuration = ride.travel.estimatedDuration; // in seconds
        const etaDistance = ride.travel.estimatedDistance; // in meters
        const realDuration = Math.ceil(normalizedDuration); // in seconds
        const realDistance = routeCalculation[0]?.distanceMeters; // in meters
        const totalTimeStopped =
          ride.progress.stops?.reduce((acc: any, curr: any) => {
            return acc + curr.totalStopInMinutes;
          }, 0) * 60 || 0;
        const { basePrice, kmPrice, minutePrice } = ride.product;

        const finalDuration = Math.max(realDuration, etaDuration) + totalTimeStopped; // in seconds
        const finalDistance = Math.max(realDistance, etaDistance); // in meters

        const finalKmPrice =
          parseFloat(basePrice) + parseFloat(kmPrice) * (finalDistance / 1000);
        const finalDurationPrice = parseFloat(minutePrice) * (finalDuration / 60);
        const rideFinalPrice = finalKmPrice + finalDurationPrice;

        const addonsPrice = ride?.billing?.addons?.length
          ? ride.billing.addons.reduce((acc: any, curr: any) => {
              return acc + parseFloat(curr.basePrice);
            }, 0)
          : 0;

        const rideTotalPrice = rideFinalPrice + addonsPrice;

        const finalPolyline = routeCalculation[0]?.polyline.encodedPolyline;

        const driverFeeTax: any = await prisma.fees.findUnique({
          where: {
            type: 'driver_fee',
          },
          select: {
            value: true,
          },
        });

        const commissionAmmount = (rideFinalPrice * parseFloat(driverFeeTax.value)) / 100;
        const allCommissions = await prisma.commissions.findMany();
        const existingRideCommission = allCommissions.find((commission) => {
          // @ts-ignore
          return commission.ride?.id === ride.id;
        });

        const rideDriverCommission = async () => {
          if (!existingRideCommission) {
            const commissionPayload = {
              type: 'ride-commission',
              ammount: commissionAmmount.toFixed(2).toString(),
              status: 'created',
              discounts: '0',
              discountType: '-',
              availableAt: '30',
              driver: {
                id: ride.driver.id,
                name: ride.driver.name,
              },
              ride: {
                id: ride.id,
                code: ride.code,
                date: new Date(ride.travel.date).toISOString(),
              },
            };

            const addCommission = await prisma.commissions.create({
              data: commissionPayload,
            });

            return addCommission.ammount;
          } else {
            return existingRideCommission.ammount;
          }
        };

        const finalTravelData = {
          ...ride.travel,
          driverCommission: await rideDriverCommission(),
          finalDuration,
          finalDistance,
          totalTimeStopped,
          finalPolyline,
          rideTotalPrice,
        };

        await prisma.rides.update({
          where: {
            id: ride.id,
          },
          data: {
            billing: {
              ...ride.billing,
              ammount: rideTotalPrice.toFixed(2),
            },
            rideFinalPrice: rideTotalPrice.toFixed(2),
            travel: finalTravelData,
          },
        });

        return ride;
      } catch (error) {
        console.error('ERROR RIDE CALCULATION API ->', error);
      }
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
