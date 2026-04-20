import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

type RideID = {
  id: string;
  code: string;
  contractId: string;
  branchId: string;
  driverId: string;
  status: string;
  startDate: string;
  endDate: string;
};
export default defineEventHandler(async (event) => {
  const query = getQuery<RideID>(event);
  const apiBaseUrl = resolveUmApiBaseUrl();

  const queryParams = new URLSearchParams();
  if (query.code) queryParams.set('code', query.code);
  if (query.status) queryParams.set('status', query.status);
  if (query.contractId) queryParams.set('contractId', query.contractId);
  if (query.branchId) queryParams.set('branchId', query.branchId);
  if (query.driverId) queryParams.set('driverId', query.driverId);
  if (query.startDate) queryParams.set('startDate', query.startDate);
  if (query.endDate) queryParams.set('endDate', query.endDate);

  try {
    if (query.id) {
      const rideByIdUrl = new URL(`/rides/${query.id}`, apiBaseUrl);
      return await $fetch(rideByIdUrl.toString(), {
        method: 'GET',
        headers: await buildUmApiAuthHeaders(event),
      });
    }

    const ridesUrl = new URL('/rides', apiBaseUrl);
    if (queryParams.toString()) {
      ridesUrl.search = queryParams.toString();
    }

    return await $fetch(ridesUrl.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao buscar atendimentos';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
