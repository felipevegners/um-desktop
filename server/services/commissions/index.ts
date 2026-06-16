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

export const createCommissionService = async (commissionData: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: commissionData,
    });
  } catch (error) {
    throw error;
  }
};

export const getCommissionsService = async (commissionId: string) => {
  try {
    if (commissionId) {
      return await fetchWithSessionRetry(() =>
        $fetch(`/api/commissions?type=${commissionId}`, {
          timeout: REQUEST_TIMEOUT_MS,
        }),
      );
    }

    return await fetchWithSessionRetry(() =>
      $fetch('/api/commissions', {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    throw error;
  }
};

export const getCommissionsStatsService = async () => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch('/api/commissions.stats', {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    throw error;
  }
};

export const batchPayCommissionsService = async (ids: string[]) => {
  try {
    return await $fetch('/api/commissions.batch-pay', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: { ids },
    });
  } catch (error) {
    throw error;
  }
};

export const updtateCommissionService = async (commissionData: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'PUT',
      timeout: REQUEST_TIMEOUT_MS,
      body: commissionData,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteCommissionService = async (commissionId: any) => {
  try {
    return await $fetch('/api/commissions', {
      method: 'DELETE',
      timeout: REQUEST_TIMEOUT_MS,
      body: { id: commissionId },
    });
  } catch (error) {
    throw error;
  }
};
