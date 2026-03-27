import { sendRidePushIfEligible } from '~/server/services/push/expo';
import { Prisma, prisma } from '~/utils/prisma';

const getDriverIdFromJson = (
  driverData: Prisma.JsonValue | null | undefined,
): string | undefined => {
  if (!driverData || Array.isArray(driverData) || typeof driverData !== 'object') {
    return undefined;
  }

  const maybeId = (driverData as Record<string, unknown>).id;
  return typeof maybeId === 'string' ? maybeId : undefined;
};

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const {
    id,
    billing,
    user,
    product,
    reason,
    travel,
    progress,
    dispatcher,
    driver,
    accepted,
    status,
    code,
    observations,
    estimatedPrice,
    rideFinalPrice,
    additionalInfo,
    extraCharges,
    sendPushNotification,
  } = payload;

  try {
    const currentRide = await prisma.rides.findUnique({
      where: {
        id,
      },
    });

    const updatedRide = await prisma.rides.update({
      where: {
        id,
      },
      data: {
        billing,
        user,
        product,
        reason,
        travel,
        progress,
        dispatcher,
        driver,
        accepted,
        status,
        code,
        observations,
        estimatedPrice,
        rideFinalPrice,
        additionalInfo,
        extraCharges,
      },
    });

    const previousDriverId = getDriverIdFromJson(currentRide?.driver as Prisma.JsonValue);
    const updatedDriverId = getDriverIdFromJson(updatedRide?.driver as Prisma.JsonValue);
    const statusChangedToPending =
      updatedRide?.status === 'pending' && currentRide?.status !== 'pending';
    const driverChanged =
      previousDriverId && updatedDriverId && previousDriverId !== updatedDriverId;
    const driverAdded = !previousDriverId && !!updatedDriverId;

    if (
      sendPushNotification === true &&
      updatedDriverId &&
      (statusChangedToPending || driverChanged || driverAdded)
    ) {
      await sendRidePushIfEligible({
        driverId: updatedDriverId,
        type: 'ride-assigned',
        ride: updatedRide,
      });
    }

    const statusChangedToCancelled =
      updatedRide?.status === 'cancelled' && currentRide?.status !== 'cancelled';
    const cancelledDriverId = updatedDriverId || previousDriverId;

    if (statusChangedToCancelled && cancelledDriverId) {
      await sendRidePushIfEligible({
        driverId: cancelledDriverId,
        type: 'ride-cancelled',
        ride: updatedRide,
      });
    }

    return updatedRide;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.log('Error Prisma -> ', error.message);
        return new Error(error.message);
      }
    }
    throw error;
  }
});
