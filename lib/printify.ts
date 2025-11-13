/**
 * Printify API Client (Server-side only)
 * Phase 9: Import MVP
 * 
 * Base URL: https://api.printify.com/v1
 * Auth: Authorization: Bearer <API_KEY>
 * Docs: https://developers.printify.com/
 */

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyProductSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PrintifyOption[];
  variants: PrintifyVariantSummary[];
  images: PrintifyImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: any[];
  sales_channel_properties: any[];
}

export interface PrintifyProductDetails extends PrintifyProductSummary {
  // Full product details (same as summary for now)
}

export interface PrintifyOption {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
}

export interface PrintifyOptionValue {
  id: number;
  title: string;
  colors?: string[];
}

export interface PrintifyVariantSummary {
  id: number;
  sku: string;
  cost: number; // in cents
  price: number; // in cents
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[]; // Array of option value IDs
}

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
  is_selected_for_publishing?: boolean;
}

export class PrintifyError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'PrintifyError';
  }
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Make a request to the Printify API
 */
async function printifyRequest<T>(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PRINTIFY_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      throw new PrintifyError(
        'Printify API rate limit exceeded. Please try again in a few minutes.',
        429,
        'RATE_LIMIT'
      );
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new PrintifyError(
        'Invalid Printify API key. Please check your credentials.',
        response.status,
        'AUTH_ERROR'
      );
    }

    // Handle not found
    if (response.status === 404) {
      throw new PrintifyError(
        'Resource not found on Printify.',
        404,
        'NOT_FOUND'
      );
    }

    // Handle server errors
    if (response.status >= 500) {
      throw new PrintifyError(
        'Printify API is currently unavailable. Please try again later.',
        response.status,
        'SERVER_ERROR'
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new PrintifyError(
        errorData.message || `Printify API error: ${response.statusText}`,
        response.status,
        errorData.code || 'UNKNOWN_ERROR'
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof PrintifyError) {
      throw error;
    }
    
    // Network or parsing errors
    if (error instanceof Error) {
      throw new PrintifyError(
        `Failed to connect to Printify: ${error.message}`,
        undefined,
        'NETWORK_ERROR'
      );
    }
    
    throw new PrintifyError('An unknown error occurred', undefined, 'UNKNOWN_ERROR');
  }
}

/**
 * Get all shops for the authenticated user
 */
export async function getShops(apiKey: string): Promise<PrintifyShop[]> {
  return printifyRequest<PrintifyShop[]>(apiKey, '/shops.json');
}

/**
 * Get all products for a specific shop
 */
export async function getShopProducts(
  apiKey: string,
  shopId: string
): Promise<PrintifyProductSummary[]> {
  const response = await printifyRequest<{ data: PrintifyProductSummary[] }>(
    apiKey,
    `/shops/${shopId}/products.json`
  );
  return response.data || [];
}

/**
 * Get detailed information about a specific product
 */
export async function getProductDetails(
  apiKey: string,
  shopId: string,
  productId: string
): Promise<PrintifyProductDetails> {
  return printifyRequest<PrintifyProductDetails>(
    apiKey,
    `/shops/${shopId}/products/${productId}.json`
  );
}

/**
 * Test API key validity by attempting to fetch shops
 */
export async function testApiKey(apiKey: string): Promise<{
  valid: boolean;
  shops?: PrintifyShop[];
  error?: string;
}> {
  try {
    const shops = await getShops(apiKey);
    return {
      valid: true,
      shops,
    };
  } catch (error) {
    if (error instanceof PrintifyError) {
      return {
        valid: false,
        error: error.message,
      };
    }
    return {
      valid: false,
      error: 'Failed to validate API key',
    };
  }
}
