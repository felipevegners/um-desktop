import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    name,
    email,
    phone,
    position,
    status,
    active,
    type,
    document,
    restrictions,
    history,
    customerId,
    department
  } = payload;

  if (type === "corp") {
    const newPassenger = await prisma.passengers.create({
      data: {
        name,
        email,
        phone,
        position,
        restrictions,
        status,
        active,
        type,
        document,
        history,
        department,
        company: {
          connect: {
            id: customerId
          }
        }
      }
    });
    return newPassenger;
  } else {
    const newPassenger = await prisma.passengers.create({
      data: {
        name,
        email,
        phone,
        document,
        status,
        active,
        type
      }
    });
    return newPassenger;
  }
});
