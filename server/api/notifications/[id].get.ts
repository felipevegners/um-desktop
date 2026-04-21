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
  const scope = await resolveNotificationRequestScope(event);

  if (scope.isManager && !scope.contractId) {
    throw createError({ statusCode: 404, statusMessage: 'Notificação não encontrada' });
  }

  const notificationUrl = new URL(`/notifications/${id}`, apiBaseUrl);

  if (scope.isManager && scope.contractId) {
    notificationUrl.searchParams.set('contractId', scope.contractId);
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
