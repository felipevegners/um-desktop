export const getNotificationsService = async (
  params?: Record<string, string | boolean>,
) => {
  try {
    return await $fetch('/api/notifications', { params });
  } catch (error) {
    console.debug('Error during notifications GET -> ', error);
    throw error;
  }
};

export const getNotificationByIdService = async (
  id: string,
  params?: Record<string, string>,
) => {
  try {
    return await $fetch(`/api/notifications/${id}`, { params });
  } catch (error) {
    console.debug('Error during notification GET by id -> ', error);
    throw error;
  }
};

export const markNotificationAsReadService = async (
  id: string,
  params?: Record<string, string>,
) => {
  try {
    return await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  } catch (error) {
    console.debug('Error during notification PATCH read -> ', error);
    throw error;
  }
};
