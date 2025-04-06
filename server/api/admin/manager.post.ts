import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  console.log('Payload ---> ', payload);
  const { contractId } = payload;

  // const newManager = await prisma.masterManager.create({ data: payload });
  // console.log('New Manager --> ', newManager);
  // const updatedContract = await prisma.contracts.update({
  //   where: {
  //     id: contractId,
  //   },
  //   data: {
  //     manager: {
  //       connect: {
  //         id: newManager.id,
  //       },
  //     },
  //   },
  // });
  // return updatedContract;
});
