import { prisma } from "~/utils/prisma";

type PassengerId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<PassengerId>(event);
  const PassengerId = query.id;
  if (PassengerId) {
    const passenger = await prisma.passengers.findUnique({
      where: {
        id: PassengerId
      }
    });

    return passenger;
  }
  const passengers = await prisma.passengers.findMany();

  return passengers;
});
