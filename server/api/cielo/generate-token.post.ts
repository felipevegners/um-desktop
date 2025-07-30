import { cieloService } from '~/server/services/cielo';
import type { CieloTokenApiResponse } from '~/types/cielo/types';

/**
 * POST /api/cielo/generate-token
 * 
 * Generates a Cielo Checkout access token using OAuth2 Basic Authentication.
 * The token is valid for 20 minutes and should be used in the Authorization header
 * for subsequent Cielo API calls.
 * 
 * @returns CieloTokenApiResponse
 */
export default defineEventHandler(async (event): Promise<CieloTokenApiResponse> => {
  try {
    const config = useRuntimeConfig();
    const isSandbox = config.cieloSandbox === 'true';

    // Generate the access token using the Cielo service
    const tokenResponse = await cieloService.generateAccessToken();

    return {
      success: true,
      data: {
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type || 'Bearer',
        expires_in: tokenResponse.expires_in || 1200, // 20 minutes (1200 seconds)
        environment: isSandbox ? 'sandbox' : 'production'
      }
    };
    
  } catch (error: any) {
    console.error('Cielo token generation error:', error);
    
    // Handle different types of errors
    if (error.response) {
      throw createError({
        statusCode: error.response.status || 500,
        statusMessage: error.response._data?.message || 'Failed to generate Cielo access token'
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error while generating token'
    });
  }
});
