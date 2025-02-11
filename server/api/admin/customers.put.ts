import { prisma } from "~/utils/prisma";

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    name,
    status,
    fantasyName,
    document,
    street,
    streetNumber,
    zipcode,
    phone,
    website,
    managerName,
    managerPhone,
    managerEmail,
    ccAreas,
    enabled
  } = payload;

  if (payload.passengers) {
    const updateCustomerPassegners = await prisma.customers.update({
      where: {
        id: payload.customer.id
      },
      data: {
        passengers: {
          connect: payload.passengers
          // [{id: 123}, {id: 345}, ...]
        }
      }
    });

    return updateCustomerPassegners;
  } else {
    const updateCustomer = await prisma.customers.update({
      where: {
        id: payload.id
      },
      data: {
        status,
        name,
        fantasyName,
        document,
        address: {
          street,
          streetNumber,
          zipcode
        },
        phone,
        website,
        managerName,
        managerPhone,
        managerEmail,
        ccAreas,
        enabled
      }
    });
    return updateCustomer;
  }
});
