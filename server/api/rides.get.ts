import { prisma } from '~/utils/prisma';

type RideID = {
  id: string;
  contractId: string;
  startDate: string;
  endDate: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<RideID>(event);
  const rideId = query.id;
  const contractId = query.contractId;
  const startDate = query.startDate;
  const endDate = query.endDate;

  if (rideId) {
    const ride = await prisma.rides.findUnique({
      where: {
        id: rideId,
      },
    });

    return ride;
  }

  let whereClause: any = {};

  if (contractId) {
    whereClause.billing = {
      paymentData: {
        contract: contractId,
      },
    };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Assuming rides have a createdAt or date field - adjust based on your schema
    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const rides = await prisma.rides.findMany({
    where: whereClause,
  });

  return rides;
});
