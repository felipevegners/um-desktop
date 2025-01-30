import { prisma } from "~/utils/prisma";

type UserId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<UserId>(event);
  const userId = query.id;
  if (userId) {
    const customer = await prisma.customers.findUnique({
      where: {
        id: userId
      },
      include: {
        passengers: true
      }
    });

    return customer;
  }
  const customers = await prisma.customers.findMany();

  return customers;
});
