import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const { id, location } = payload;

  await prisma.drivers.update({
    where: {
      id: id,
    },
    data: {
      location,
    },
  });
  return {
    status: 'OK',
  };
});
