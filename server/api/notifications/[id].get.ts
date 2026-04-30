import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { resolveNotificationRequestScope } from '../../utils/notification-scope';
import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../../utils/um-api';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Notification id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const query = getQuery(event) as Record<string, string | undefined>;
  const scope = await resolveNotificationRequestScope(event);

  const notificationUrl = new URL(`/notifications/${id}`, apiBaseUrl);

  // Envia os parâmetros corretos conforme o role
  if (scope.role === 'admin') {
    // nada, admin vê tudo
  } else if (scope.role === 'master-manager') {
    if (scope.contractId)
      notificationUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'branch-manager' || scope.role === 'platform-admin') {
    if (scope.branchId) notificationUrl.searchParams.set('branchId', scope.branchId);
  } else if (scope.role === 'platform-corp-user') {
    if (scope.userId) notificationUrl.searchParams.set('userId', scope.userId);
    if (scope.contractId)
      notificationUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'platform-driver') {
    if (scope.userId) notificationUrl.searchParams.set('userId', scope.userId);
    if (scope.driverId) notificationUrl.searchParams.set('driverId', scope.driverId);
  } else if (scope.role === 'platform-user') {
    if (scope.userId) notificationUrl.searchParams.set('userId', scope.userId);
  }

  for (const [k, v] of Object.entries(query)) {
    if (
      !notificationUrl.searchParams.has(k) &&
      v !== undefined &&
      v !== null &&
      String(v) !== ''
    )
      notificationUrl.searchParams.set(k, String(v));
  }

  try {
    return await $fetch(notificationUrl.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao buscar notificação';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
