import { createError } from 'h3';
import { $fetch } from 'ofetch';

import { resolveNotificationRequestScope } from '../utils/notification-scope';
import { buildUmApiAuthHeaders, resolveUmApiBaseUrl } from '../utils/um-api';

type NotificationQuery = {
  read?: string;
};

export default defineEventHandler(async (event) => {
  const apiBaseUrl = resolveUmApiBaseUrl();
  const scope = await resolveNotificationRequestScope(event);
  const query = getQuery<NotificationQuery>(event);

  // If user is a manager but we have neither contractId nor branchId, deny access
  if (scope.isManager && !scope.contractId && !scope.branchId) {
    return [];
  }

  const notificationsUrl = new URL('/notifications', apiBaseUrl);

  if (scope.isManager && scope.contractId) {
    notificationsUrl.searchParams.set('contractId', scope.contractId);
  }

  // If branch-level scope is available, prefer requesting filtered by branchId
  if (scope.isManager && (scope.branchId || '') !== '') {
    notificationsUrl.searchParams.set('branchId', scope.branchId as string);
  }

  if (query.read === 'true' || query.read === 'false') {
    notificationsUrl.searchParams.set('read', query.read);
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
