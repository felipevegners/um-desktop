import { prisma } from '~/utils/prisma';

type ServiceId = {
  id: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery<ServiceId>(event);
  const serviceId = query.id;
  if (serviceId) {
    const service = await prisma.services.findUnique({
      where: {
        id: serviceId,
      },
    });

    return service;
  }
  const services = await prisma.services.findMany();

  return services;
});
