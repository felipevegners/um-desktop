import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const newCustomer = await prisma.customers.create({ data: payload });

  return newCustomer;
});
