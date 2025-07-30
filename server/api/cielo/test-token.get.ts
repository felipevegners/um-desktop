import { cieloService } from '~/server/services/cielo';

/**
 * GET /api/cielo/test-token
 *
 * Test endpoint to verify that Cielo token generation is working properly.
 * This endpoint will generate a token and return information about it.
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const isSandbox = config.cieloSandbox === 'true';

    // Test token generation
    const startTime = Date.now();
    const tokenResponse = await cieloService.generateAccessToken();
    const endTime = Date.now();

    // Get token using cached method
    const cachedToken = await cieloService.getValidAccessToken();

    return {
      success: true,
      test_results: {
        token_generated: !!tokenResponse.access_token,
        token_preview: tokenResponse.access_token,
        token_type: tokenResponse.token_type || 'Bearer',
        expires_in: tokenResponse.expires_in || 1200,
        generation_time_ms: endTime - startTime,
        environment: isSandbox ? 'sandbox' : 'production',
        cached_token_matches: cachedToken === tokenResponse.access_token,
        timestamp: new Date().toISOString(),
      },
      credentials_status: {
        client_id_configured: !!config.cieloMerchantId,
        client_secret_configured: !!config.cieloMerchantKey,
        sandbox_mode: isSandbox,
      },
    };
  } catch (error: any) {
    console.error('Cielo token test failed:', error);

    return {
      success: false,
      error: {
        message: error.message || 'Token generation test failed',
        timestamp: new Date().toISOString(),
      },
      credentials_status: {
        client_id_configured: !!useRuntimeConfig().cieloMerchantId,
        client_secret_configured: !!useRuntimeConfig().cieloMerchantKey,
        sandbox_mode: useRuntimeConfig().cieloSandbox === 'true',
      },
    };
  }
});
