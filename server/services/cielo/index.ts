import { CIELO_URL } from '@/config/paths';
import type {
  CieloCheckoutRequest,
  CieloCheckoutResponse,
  CieloTokenResponse,
} from '~/types/cielo/types';

export class CieloService {
  private static instance: CieloService;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  private constructor() {}

  public static getInstance(): CieloService {
    if (!CieloService.instance) {
      CieloService.instance = new CieloService();
    }
    return CieloService.instance;
  }

  /**
   * Generates a new access token from Cielo API
   */
  async generateAccessToken(): Promise<CieloTokenResponse> {
    const config = useRuntimeConfig();

    const clientId = config.cieloMerchantId;
    const clientSecret = config.cieloMerchantKey;

    if (!clientId || !clientSecret) {
      throw new Error('Cielo credentials are not configured');
    }

    // Concatenate ClientId and ClientSecret as per Cielo documentation
    const credentials = `${clientId}:${clientSecret}`;

    // Encode in Base64
    const authString = Buffer.from(credentials, 'utf-8').toString('base64');

    try {
      const response = await $fetch<CieloTokenResponse>(
        'https://cieloecommerce.cielo.com.br/api/public/v2/token',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: {},
        },
      );

      return response;
    } catch (error: any) {
      console.error('Failed to generate Cielo access token:', error);
      throw new Error(`Cielo API Error: ${error.message}`);
    }
  }

  /**
   * Gets a valid access token (either cached or generates a new one)
   */
  async getValidAccessToken(): Promise<string> {
    const now = Date.now();

    // Check if we have a cached token that's still valid (with 1 minute buffer)
    if (this.cachedToken && now < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.token;
    }

    // Generate new token
    const tokenResponse = await this.generateAccessToken();

    // Cache the token (default 20 minutes = 1200 seconds)
    const expiresIn = (tokenResponse.expires_in || 1200) * 1000; // Convert to milliseconds
    this.cachedToken = {
      token: tokenResponse.access_token,
      expiresAt: now + expiresIn,
    };

    return tokenResponse.access_token;
  }

  /**
   * Creates a Cielo Checkout page and returns the checkout URL
   * @param checkoutData - The checkout request data
   * @returns Promise<CieloCheckoutResponse>
   */
  async createCheckout(
    checkoutData: CieloCheckoutRequest,
  ): Promise<CieloCheckoutResponse> {
    try {
      const config = useRuntimeConfig();

      // Get a valid access token
      const accessToken = await this.getValidAccessToken();

      // Make the request to create checkout
      const response = await $fetch<CieloCheckoutResponse>(CIELO_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          MerchantId: config.cieloMerchantId,
        },
        body: checkoutData,
      });
      return response;
    } catch (error: any) {
      console.error('Failed to create Cielo checkout:', error);
      console.error('Error details:', error.data || error.response);
      throw new Error(`Cielo Checkout Error: ${error.message}`);
    }
  }

  /**
   * Clears the cached token (useful for testing or manual refresh)
   */
  clearCachedToken(): void {
    this.cachedToken = null;
  }

  async getCieloPaymentStatus(url: string): Promise<any> {
    try {
      if (url) {
        const response = await $fetch(url);
        return response;
      }
    } catch (error: any) {
      console.error('Failed to get Cielo Transaction Data --->', error);
      console.error('Error details:', error.data || error.response);
      // throw new Error(`Cielo Checkout Error: ${error.message}`);
    }
  }
}

export const cieloService = CieloService.getInstance();
