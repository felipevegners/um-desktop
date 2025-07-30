import { cieloService } from '@/server/services/cielo';
import type { CieloCheckoutApiResponse, CieloCheckoutRequest } from '@/types/cielo/types';

/**
 * POST /api/cielo/create-checkout
 *
 * Creates a Cielo Checkout page and returns the checkout URL.
 * This endpoint creates a hosted payment page where customers can enter
 * their payment details securely on Cielo's platform.
 *
 * @body CieloCheckoutRequest
 * @returns CieloCheckoutApiResponse
 */
export default defineEventHandler(async (event): Promise<CieloCheckoutApiResponse> => {
  try {
    const body = await readBody(event);
    const { orderNumber, shipping, type, name, description, price, expirationDate } =
      body;

    // Helper function to sanitize phone number
    // const sanitizePhone = (phone: string | undefined): string | undefined => {
    //   if (!phone) return undefined;
    //   // Remove all non-numeric characters
    //   const cleaned = phone.replace(/\D/g, '');
    //   // Return only if we have a valid phone number (at least 10 digits)
    //   return cleaned.length >= 10 ? cleaned : undefined;
    // };

    // Prepare the checkout request data
    const checkoutData: CieloCheckoutRequest = {
      orderNumber,
      shipping,
      type,
      name,
      description,
      price,
      expirationDate,
    };

    // Create the checkout using Cielo service
    const checkoutResponse = await cieloService.createCheckout(checkoutData);

    return {
      success: true,
      data: checkoutResponse,
    };
  } catch (error: any) {
    console.error('Cielo checkout creation error:', error);

    // Handle different types of errors
    if (error.response) {
      throw createError({
        statusCode: error.response.status || 500,
        statusMessage: error.response._data?.message || 'Failed to create Cielo checkout',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error while creating checkout',
    });
  }
});
