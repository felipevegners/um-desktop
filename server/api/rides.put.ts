import { createError } from 'h3';
import { $fetch } from 'ofetch';
import { sendRidePushIfEligible } from '~/server/services/push/expo';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

const getDriverIdFromUnknown = (driverData: unknown): string | undefined => {
  if (!driverData || Array.isArray(driverData) || typeof driverData !== 'object') {
    return undefined;
  }

  const maybeId = (driverData as Record<string, unknown>).id;
  return typeof maybeId === 'string' ? maybeId : undefined;
};

export default defineEventHandler(async (event) => {
  const payload = await readBody(event);
  const { id, sendPushNotification, ...ridePayload } = payload;

  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Ride id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const rideByIdUrl = new URL(`/rides/${id}`, apiBaseUrl);

  try {
    const authHeaders = await buildUmApiAuthHeaders(event);

    const currentRide: any = await $fetch(rideByIdUrl.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    const updatedRide: any = await $fetch(rideByIdUrl.toString(), {
      method: 'PATCH',
      headers: authHeaders,
      body: ridePayload,
    });

    const previousDriverId = getDriverIdFromUnknown(currentRide?.driver);
    const updatedDriverId = getDriverIdFromUnknown(updatedRide?.driver);
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
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao atualizar atendimento';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
