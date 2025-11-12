// Simple country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  BR: 'BRL',
  PT: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  IN: 'INR',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  ZA: 'ZAR',
};

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
}

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ZA', name: 'South Africa' },
];
