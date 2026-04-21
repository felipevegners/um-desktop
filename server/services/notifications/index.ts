export const getNotificationsService = async () => {
  try {
    return await $fetch('/api/notifications');
  } catch (error) {
    console.log('Error during notifications GET -> ', error);
    throw error;
  }
};

export const getNotificationByIdService = async (id: string) => {
  try {
    return await $fetch(`/api/notifications/${id}`);
  } catch (error) {
    console.log('Error during notification GET by id -> ', error);
    throw error;
  }
};

export const markNotificationAsReadService = async (id: string) => {
  try {
    return await $fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.log('Error during notification PATCH read -> ', error);
    throw error;
  }
};
