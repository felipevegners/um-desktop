const REQUEST_TIMEOUT_MS = 20000;

export const getNotificationsService = async (
  params?: Record<string, string | boolean>,
) => {
  try {
    return await $fetch('/api/notifications', {
      params,
      timeout: REQUEST_TIMEOUT_MS,
    });
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
