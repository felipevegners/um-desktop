import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  console.log('Payload ---> ', payload);

  // try {
  //   const updateCustomer = await prisma.contracts.update({
  //     where: {
  //       id: payload.id,
  //     },
  //     data: {},
  //   });
  //   return updateCustomer;
  // } catch (error) {
  //   console.log('Error during PUT API ->');
  // }
});
