import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    name,
    document,
    street,
    streetNumber,
    zipcode,
    phone,
    website,
    managerName,
    managerPhone,
    managerEmail,
  } = payload;

  const updateCustomer = await prisma.customers.update({
    where: {
      id: payload.id,
    },
    data: {
      name,
      document,
      address: {
        street,
        streetNumber,
        zipcode,
      },
      phone,
      website,
      managerName,
      managerPhone,
      managerEmail,
    },
  });

  return updateCustomer;
});
