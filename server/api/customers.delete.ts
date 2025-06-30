import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id } = payload;
  await prisma.customers.delete({
    where: { id },
  });
  // await prisma.customers
  //   .update({
  //     where: {
  //       id
  //     },
  //     data: {
  //       passengers: {
  //         deleteMany: {}
  //       }
  //     },
  //     include: {
  //       passengers: true
  //     }
  //   })
  //   .then(async () => {
  //     await prisma.customers.delete({
  //       where: { id }
  //     });
  //   });
});
