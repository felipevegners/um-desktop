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

export const getRideRoutesService = async (rideData: any) => {
  try {
    const response = await $fetch('/api/travels/routes', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: {
        ...rideData,
      },
    });
    return response;
  } catch (error) {
    return error;
  }
};

export const getRideDistanceService = async (payload: {
  origins: string[];
  destinations: string[];
}) => {
  try {
    const { origins, destinations } = payload;
    // Join with pipe as expected by the Distance Matrix API
    const params = {
      origins: Array.isArray(origins) ? origins.join('|') : origins,
      destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
    } as Record<string, string>;

    const response = await $fetch('/api/travels/distance', {
      method: 'GET',
      timeout: REQUEST_TIMEOUT_MS,
      params,
    });

    return response;
  } catch (error) {
    return error;
  }
};

export const getRidesService = async (
  rideId: string,
  query?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    if (rideId) {
      const params = new URLSearchParams({ id: rideId });
      if (query?.publicTrack) {
        params.set('publicTrack', '1');
      }

      return await fetchWithSessionRetry(() =>
        $fetch(`/api/rides?${params.toString()}`, {
          timeout: REQUEST_TIMEOUT_MS,
        }),
      );
    }

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        params.set(key, String(value));
      }

      const queryString = params.toString();
      return await fetchWithSessionRetry(() =>
        $fetch(queryString ? `/api/rides?${queryString}` : '/api/rides', {
          timeout: REQUEST_TIMEOUT_MS,
        }),
      );
    }

    return await fetchWithSessionRetry(() =>
      $fetch('/api/rides', {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during service GET -> ', error);
    throw error;
  }
};

export const getRideByCodeService = async (code: string) => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch(`/api/rides?code=${encodeURIComponent(code)}`, {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during service GET by code -> ', error);
    throw error;
  }
};

export const getContractRidesService = async (contractId: string) => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch(`/api/rides?contractId=${contractId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during rides by contract ID service GET -> ', error);
    throw error;
  }
};

export const getRidesByDateRangeService = async (startDate: string, endDate: string) => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch(`/api/rides?startDate=${startDate}&endDate=${endDate}`, {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during rides by date range service GET -> ', error);
    throw error;
  }
};

export const getRidesByDateRangeAndContractIdService = async (
  startDate: string,
  endDate: string,
  contractId: string,
) => {
  try {
    return await fetchWithSessionRetry(() =>
      $fetch(
        `/api/rides?startDate=${startDate}&endDate=${endDate}&contractId=${contractId}`,
        {
          timeout: REQUEST_TIMEOUT_MS,
        },
      ),
    );
  } catch (error) {
    console.debug('Error during rides by date range service GET -> ', error);
    throw error;
  }
};

export const createRideService = async (rideData: any) => {
  try {
    return await $fetch('/api/rides', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: rideData,
    });
  } catch (error) {
    console.debug('Error during service POST -> ', error);
    throw error;
  }
};

export const updateRideService = async (rideData: any) => {
  try {
    await $fetch('/api/rides', {
      method: 'PUT',
      timeout: REQUEST_TIMEOUT_MS,
      body: rideData,
    });
  } catch (error) {
    console.debug('Error during update Service -> ', error);
    throw error;
  }
};
export const deleteRideService = async (id: string) => {
  try {
    await $fetch('/api/rides', {
      method: 'DELETE',
      timeout: REQUEST_TIMEOUT_MS,
      body: { id },
    });
  } catch (error) {
    console.debug('Error during delete Service -> ', error);
    throw error;
  }
};
