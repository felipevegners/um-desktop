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

export const getInvoicesService = async (
  invoiceId?: string,
  query?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const params = new URLSearchParams();

    if (invoiceId) {
      params.set('id', invoiceId);
    }

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        params.set(key, String(value));
      }
    }

    const queryString = params.toString();
    return await fetchWithSessionRetry(() =>
      $fetch(queryString ? `/api/invoices?${queryString}` : '/api/invoices', {
        timeout: REQUEST_TIMEOUT_MS,
      }),
    );
  } catch (error) {
    console.debug('Error during invoices service GET -> ', error);
    throw error;
  }
};

export const createInvoiceService = async (invoiceData: any) => {
  try {
    return await $fetch('/api/invoices', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body: invoiceData,
    });
  } catch (error) {
    console.debug('Error during invoices service POST -> ', error);
    throw error;
  }
};

export const updateInvoiceService = async (invoiceId: string, payload: any) => {
  try {
    return await $fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      timeout: REQUEST_TIMEOUT_MS,
      body: payload,
    });
  } catch (error) {
    console.debug('Error during invoices service PATCH -> ', error);
    throw error;
  }
};
