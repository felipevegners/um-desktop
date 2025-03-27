import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    status,
    name,
    fantasyName,
    document,
    address,
    phone,
    website,
    logo,
    enabled,
  } = payload;

  const newCompany = await prisma.customers.create({ data: payload });
  // console.log('New Company --> ', newCompany);
  const newContract = await prisma.contracts.create({
    data: {
      company: {
        connect: {
          id: newCompany.id,
        },
      },
    },
  });
  return newContract;
});
