import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  const deleted = await prisma.accounts.delete({
    where: { id },
  });
  return deleted;
});
