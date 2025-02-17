import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    id,
    name,
    email,
    phone,
    department,
    position,
    status,
    restrictions,
    active,
    history
  } = payload;

  const updateCustomer = await prisma.passengers.update({
    where: {
      id: id
    },
    data: {
      name,
      email,
      phone,
      department,
      position,
      status,
      restrictions,
      active,
      history
    }
  });
  return updateCustomer;
});
