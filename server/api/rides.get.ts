import { prisma } from '~/utils/prisma';

type RideID = {
  id: string;
  contractId: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<RideID>(event);
  const rideId = query.id;
  const contractId = query.contractId;

  if (rideId) {
    const ride = await prisma.rides.findUnique({
      where: {
        id: rideId,
      },
    });

    return ride;
  }
  const rides = await prisma.rides.findMany();

  if (contractId) {
    const filterContractRides = rides.filter(
      (ride) => ride.billing.paymentData?.contract === contractId,
    );
    return filterContractRides;
  }

  return rides;
});
