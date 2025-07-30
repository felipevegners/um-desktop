import type {
  CieloCheckoutApiResponse,
  CieloCheckoutRequest,
  CieloTokenApiResponse,
} from '~/types/cielo/types';

export const useCielo = () => {
  /**
   * Generates a new Cielo access token
   * @returns Promise<CieloTokenApiResponse>
   */
  const generateToken = async (): Promise<CieloTokenApiResponse> => {
    try {
      const response = await $fetch<CieloTokenApiResponse>('/api/cielo/generate-token', {
        method: 'POST',
      });

      return response;
    } catch (error: any) {
      console.error('Failed to generate Cielo token:', error);
      throw error;
    }
  };

  /**
   * Utility function to make authenticated requests to Cielo API
   * @param url - The Cielo API endpoint
   * @param options - Request options
   * @returns Promise<any>
   */
  const makeAuthenticatedRequest = async (url: string, options: any = {}) => {
    try {
      // First, get a valid access token
      const tokenResponse = await generateToken();

      if (!tokenResponse.success) {
        throw new Error('Failed to obtain access token');
      }

      // Make the authenticated request
      return await $fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  };

  /**
   * Creates a Cielo Checkout and returns the checkout URL
   * @param checkoutData - The checkout request data
   * @returns Promise<CieloCheckoutApiResponse>
   */
  const createCheckout = async (
    checkoutData: CieloCheckoutRequest,
  ): Promise<CieloCheckoutApiResponse> => {
    try {
      const response = await $fetch<CieloCheckoutApiResponse>(
        '/api/cielo/create-checkout',
        {
          method: 'POST',
          body: checkoutData,
        },
      );

      return response;
    } catch (error: any) {
      console.error('Failed to create Cielo checkout:', error);
      throw error;
    }
  };

  /**
   * Helper function to create a simple checkout for a single item
   * @param options - Simplified checkout options
   * @returns Promise<CieloCheckoutApiResponse>
   */
  const createSimpleCheckout = async (options: {
    orderNumber?: string;
    amount: number;
    itemName: string;
    itemDescription?: string;
  }): Promise<CieloCheckoutApiResponse> => {
    const checkoutData: CieloCheckoutRequest = {
      orderNumber: options.orderNumber as string,
      shipping: {
        type: 'WithoutShipping',
      },
      type: 'Service',
      name: options.itemName,
      description: options.itemDescription,
      price: options.amount,
      expirationDate: '2037-06-19 16:30:00',
    };

    return await createCheckout(checkoutData);
  };

  return {
    generateToken,
    makeAuthenticatedRequest,
    createCheckout,
    createSimpleCheckout,
  };
};
