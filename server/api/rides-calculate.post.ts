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
      const stopsLocations =
        ride?.progress?.stops?.map((stop: any) => {
          return {
            lat: stop.location.latitude,
            lng: stop.location.longitude,
          };
        }) || [];
      const locations = ride?.progress.startLocation
        ? [
            {
              lat: ride.progress.startLocation.latitude,
              lng: ride.progress.startLocation.longitude,
            },
            ...stopsLocations,
            {
              lat: ride.progress.finishedLocation.latitude,
              lng: ride.progress.finishedLocation.longitude,
            },
          ]
        : [
            {
              lat: ride?.travel.origin.lat,
              lng: ride?.travel.origin.lng,
            },
            ...stopsLocations,
            {
              lat: ride?.travel.destination.lat,
              lng: ride?.travel.destination.lng,
            },
          ];
      const time =
        ride?.progress?.finishedAt !== ''
          ? new Date(ride?.progress?.finishedAt)
          : new Date();
      time.setHours(time.getHours() + 3);

      try {
        const routeCalculation = await getRideRoutesService({
          locations,
          // departureTime: time.toISOString(),
        });

        const etaDuration = ride.travel.estimatedDuration; // in seconds
        const etaDistance = ride.travel.estimatedDistance; // in meters
        const startedTime = new Date(ride?.progress?.startedAt).getTime();
        const finishedTime = new Date(ride?.progress?.finishedAt).getTime();

        const realDistance = routeCalculation[0]?.distanceMeters; // in meters
        const realDuration = Math.ceil((finishedTime - startedTime) / 1000); // in seconds

        const totalTimeStopped =
          ride.progress.stops?.reduce((acc: any, curr: any) => {
            return acc + curr.totalStopInMinutes;
          }, 0) * 60 || 0;

        const finalDuration = realDuration + totalTimeStopped; // in seconds

        const { basePrice, kmPrice, minutePrice } = ride.product;

        let rideExtraKms = 0;
        let rideExtraHours = 0;
        let rideExtraKmPrice = '0';
        let rideExtraHourPrice = '0';

        let calculatedFinalPrice = parseFloat(basePrice);

        if (ride?.product.type === 'contract') {
          console.log('CAIU AQUI ');
          // Se a distancia final for maior que a distância incluída no produto
          if (realDistance > ride.product?.includedKms * 1000) {
            console.log('DIST. MAIOR QUE A FRANQUIA ');

            const extraKms = Math.ceil(
              (realDistance - ride.product?.includedKms * 1000) / 1000,
            );
            const diffPrice = extraKms * parseFloat(kmPrice);

            rideExtraKmPrice = diffPrice.toFixed(2).toString();
            rideExtraKms = extraKms;

            calculatedFinalPrice += diffPrice;
            console.log('CALCULADO COM KM EXCENDETE --->', calculatedFinalPrice);
          }
          // Se a duração final for maior que a duração incluída no produto
          const includedHoursToSeconds = ride.product?.includedHours * 60 * 60;
          if (finalDuration > includedHoursToSeconds) {
            console.log('DURAÇÃO MAIOR QUE A FRANQUIA ');

            const totalInSeconds = finalDuration - includedHoursToSeconds;
            const totalInMinutes = Math.ceil(totalInSeconds / 60);

            const diffPriceDuration =
              totalInMinutes * parseFloat(ride.product.minutePrice);

            rideExtraHourPrice = diffPriceDuration.toFixed(2).toString();
            rideExtraHours = totalInMinutes / 60;
            calculatedFinalPrice += diffPriceDuration;

            console.log('CALCULADO COM TEMPO EXCENDETE --->', calculatedFinalPrice);
          }
        } else {
          const finalKmPrice =
            parseFloat(basePrice) + parseFloat(kmPrice) * (realDistance / 1000);

          const finalDurationPrice = parseFloat(minutePrice) * (finalDuration / 60);
          calculatedFinalPrice = finalKmPrice + finalDurationPrice;
        }
        // START CALCULATE ADDONS PRICE
        const addonsPrice = ride?.billing?.addons?.length
          ? ride.billing.addons.reduce((acc: any, curr: any) => {
              return acc + parseFloat(curr.basePrice);
            }, 0)
          : 0;

        const rideTotalPrice = calculatedFinalPrice + addonsPrice;
        // END CALCULATE ADDONS PRICE

        // START DRIVER COMMISSION CALCULATION
        const currentDriverFeeTax: any = await prisma.fees.findUnique({
          where: {
            type: 'driver_fee',
          },
          select: {
            value: true,
          },
        });

        const commissionAmmount =
          (calculatedFinalPrice * parseFloat(currentDriverFeeTax.value)) / 100;
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
        // END DRIVER COMMISSION CALCULATION

        const realizedPolyline = routeCalculation[0]?.polyline.encodedPolyline;

        const completedRideData = {
          completedData: {
            rideTotalPrice,
            finalDistance: realDistance,
            finalDuration,
            totalTimeStopped,
            driverCommission: await rideDriverCommission(),
            rideExtraKms,
            rideExtraHours,
            rideExtraKmPrice,
            rideExtraHourPrice,
            realizedPolyline,
          },
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
            travel: {
              ...ride.travel,
              ...completedRideData,
            },
            progress: ride?.progress.startLocation
              ? ride.progress
              : {
                  ...ride.progress,
                  finishedAt: time.toISOString(),
                },
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
