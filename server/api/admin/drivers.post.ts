import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  //   console.log("Driver Payload -> ", payload);
  const newDriver = await prisma.drivers.create({
    data: payload
  });

  return newDriver;
});
