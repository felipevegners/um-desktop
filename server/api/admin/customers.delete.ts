import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;
  await prisma.customers.delete({
    where: { id },
    include: {
      passengers: true,
    },
  });
});
