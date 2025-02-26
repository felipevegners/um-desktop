import { prisma } from "~/utils/prisma";

type DriverId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<DriverId>(event);
  const driverId = query.id;
  if (driverId) {
    const driver = await prisma.drivers.findUnique({
      where: {
        id: driverId
      }
    });

    return driver;
  } else {
    const drivers = await prisma.drivers.findMany();
    return drivers;
  }
});
