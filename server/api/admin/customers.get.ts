import { prisma } from "~/utils/prisma";

export default defineEventHandler(async () => {
  const customers = await prisma.customers.findMany();

  return customers;
});
