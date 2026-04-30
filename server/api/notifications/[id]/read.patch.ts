import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { resolveNotificationRequestScope } from '../../../../server/utils/notification-scope';
import {
  buildUmApiAuthHeaders,
  resolveUmApiBaseUrl,
} from '../../../../server/utils/um-api';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Notification id is required' });
  }

  const apiBaseUrl = resolveUmApiBaseUrl();
  const query = getQuery(event) as Record<string, string | undefined>;
  const scope = await resolveNotificationRequestScope(event);

  const markReadUrl = new URL(`/notifications/${id}/read`, apiBaseUrl);

  // Envia os parâmetros corretos conforme o role
  if (scope.role === 'admin') {
    // nada, admin vê tudo
  } else if (scope.role === 'master-manager') {
    if (scope.contractId) markReadUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'branch-manager' || scope.role === 'platform-admin') {
    if (scope.branchId) markReadUrl.searchParams.set('branchId', scope.branchId);
  } else if (scope.role === 'platform-corp-user') {
    if (scope.userId) markReadUrl.searchParams.set('userId', scope.userId);
    if (scope.contractId) markReadUrl.searchParams.set('contractId', scope.contractId);
  } else if (scope.role === 'platform-driver') {
    if (scope.userId) markReadUrl.searchParams.set('userId', scope.userId);
    if (scope.driverId) markReadUrl.searchParams.set('driverId', scope.driverId);
  } else if (scope.role === 'platform-user') {
    if (scope.userId) markReadUrl.searchParams.set('userId', scope.userId);
  }

  for (const [k, v] of Object.entries(query)) {
    if (
      !markReadUrl.searchParams.has(k) &&
      v !== undefined &&
      v !== null &&
      String(v) !== ''
    )
      markReadUrl.searchParams.set(k, String(v));
  }

  try {
    return await $fetch(markReadUrl.toString(), {
      method: 'PATCH',
      headers: await buildUmApiAuthHeaders(event),
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status || 500;
    const statusMessage =
      error?.data?.message ||
      error?.statusMessage ||
      'Erro ao marcar notificação como lida';

    throw createError({
      statusCode,
      statusMessage,
      data: error?.data,
    });
  }
});
