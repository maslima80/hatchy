import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

export const SUPPORTED_COUNTRIES = [
  'US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'AT', 'BE', 'DK', 'FI', 'FR', 'DE', 'IT', 'LU', 'NL', 'NO', 'PT', 'ES', 'SE', 'CH',
  'JP', 'SG', 'HK', 'MX', 'BR',
];

export function isCountrySupported(country: string): boolean {
  return SUPPORTED_COUNTRIES.includes(country.toUpperCase());
}
