const REQUEST_TIMEOUT_MS = 20000;

const isSession401 = (error: any) => {
  const statusCode = error?.statusCode || error?.response?.status;
  const statusMessage = String(error?.statusMessage || error?.data?.message || '');
  return statusCode === 401 && statusMessage.includes('Sessão inválida ou expirada');
};

const fetchWithSessionRetry = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error: any) {
    if (!isSession401(error)) {
      throw error;
    }

    try {
      await $fetch('/api/auth/session', { timeout: REQUEST_TIMEOUT_MS });
    } catch {
      // Ignore and retry original request once.
    }

    return await request();
  }
};

export const getNotificationsService = async (
  params?: Record<string, string | boolean>,
) => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch('/api/notifications', {
        params,
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during notifications GET -> ', error);
    throw error;
  }
};

export const markNotificationAsReadService = async (
  id: string,
  params?: Record<string, string>,
) => {
  try {
    return await $fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    console.debug('Error during notification PATCH read -> ', error);
    throw error;
  }
};
