export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
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
