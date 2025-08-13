import { prisma } from '~/utils/prisma';

type DriverId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  // setHeaders(event, {
  //   'Access-Control-Allow-Origin': '*', // Or specific origins
  //   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  //   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // });

  // if (event.method === 'OPTIONS') {
  //   return 'ok'; // Handle preflight requests
  // }
  const query = getQuery<DriverId>(event);
  const driverId = query.id;
  if (driverId) {
    const driver = await prisma.drivers.findUnique({
      where: {
        id: driverId,
      },
    });

    return driver;
  } else {
    const drivers = await prisma.drivers.findMany();
    return drivers;
  }
});
