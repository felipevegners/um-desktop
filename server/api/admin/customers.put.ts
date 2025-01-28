import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  console.log(payload);
  const {
    name,
    status,
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
      status,
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
