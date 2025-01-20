import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  // console.log("payload -> ", payload);
  const newCustomer = await prisma.customers.create({ data: payload });

  // return newCustomer;
});
