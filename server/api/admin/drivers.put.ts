import { prisma } from '~/utils/prisma';

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);

  const {
    id,
    name,
    email,
    phone,
    document,
    driverLicense,
    address,
    status,
    driverCars,
    driverFiles,
    rating,
    history,
    actuationArea,
    scheduleOpen,
    outsideActuation,
    enabled,
  } = payload;

  const updateDriver = await prisma.drivers.update({
    where: {
      id: id,
    },
    data: {
      name,
      email,
      phone,
      document,
      driverLicense,
      address,
      status,
      driverCars,
      driverFiles,
      rating,
      history,
      actuationArea,
      scheduleOpen,
      outsideActuation,
      enabled,
    },
  });
  return updateDriver;
});
