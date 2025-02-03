import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;
  await prisma.passengers.delete({ where: { id } });
});
