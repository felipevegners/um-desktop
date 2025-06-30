import { prisma } from '~/utils/prisma';

type RideID = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<RideID>(event);
  const rideId = query.id;
  if (rideId) {
    const ride = await prisma.rides.findUnique({
      where: {
        id: rideId,
      },
    });

    return ride;
  }
  const rides = await prisma.rides.findMany();

  return rides;
});
