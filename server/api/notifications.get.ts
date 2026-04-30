import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { resolveNotificationRequestScope } from '../utils/notification-scope';
import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

export default defineEventHandler(async (event) => {
  const apiBaseUrl = resolveUmApiBaseUrl();
  const query = getQuery(event) as Record<string, string | undefined>;
  const scope = await resolveNotificationRequestScope(event);

  const notificationsUrl = new URL('/notifications', apiBaseUrl);

  // Envia os parâmetros corretos conforme o role
  if (scope.role === 'admin') {
    // nada, admin vê tudo
  } else if (scope.role === 'master-manager') {
    if (scope.contractId)
      notificationsUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'platform-admin') {
    if (scope.branchId) notificationsUrl.searchParams.set('branchId', scope.branchId);
  } else if (scope.role === 'platform-corp-user') {
    if (scope.userId) notificationsUrl.searchParams.set('userId', scope.userId);
    if (scope.contractId)
      notificationsUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'platform-driver') {
    if (scope.userId) notificationsUrl.searchParams.set('userId', scope.userId);
    if (scope.driverId) notificationsUrl.searchParams.set('driverId', scope.driverId);
  } else if (scope.role === 'platform-user') {
    if (scope.userId) notificationsUrl.searchParams.set('userId', scope.userId);
  }

  // forward any explicit provided query params (but don't override session-provided ones)
  for (const [k, v] of Object.entries(query)) {
    if (
      !notificationsUrl.searchParams.has(k) &&
      v !== undefined &&
      v !== null &&
      String(v) !== ''
    ) {
      notificationsUrl.searchParams.set(k, String(v));
    }
  }

  try {
    return await $fetch(notificationsUrl.toString(), {
      method: 'GET',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message || error?.statusMessage || 'Erro ao buscar notificações';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
