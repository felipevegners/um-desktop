export interface CieloTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface CieloTokenApiResponse {
  success: boolean;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    environment: 'sandbox' | 'production';
  };
}

export interface CieloErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
  };
}

// Cielo Checkout API types
export interface CieloCheckoutRequest {
  orderNumber?: string;
  shipping: {
    type:
      | 'Correios'
      | 'FixedFreeShipping'
      | 'Free'
      | 'WithoutShippingPickUp'
      | 'WithoutShipping';
  };
  payment: {
    capture: boolean;
  };
  sku: string;
  type: string;
  name: string;
  description?: string;
  price: string | number;
  expirationDate: string;
}

export interface CieloCheckoutResponse {
  checkoutUrl: string;
  orderNumber: string;
  settings: {
    checkoutUrl: string;
    profile: string;
    version: number;
  };
}

export interface CieloCheckoutApiResponse {
  success: boolean;
  data: any;
}
