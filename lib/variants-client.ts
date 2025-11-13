/**
 * Client-safe variant utilities
 * These functions can be used in both client and server components
 */

export interface ProductOption {
  name: string;
  values: string[];
}

/**
 * Generate all variant combinations from option groups (Cartesian product)
 * @example
 * generateVariantCombinations([
 *   { name: "Size", values: ["S", "M"] },
 *   { name: "Color", values: ["Red", "Blue"] }
 * ])
 * // Returns: [
 * //   { "Size": "S", "Color": "Red" },
 * //   { "Size": "S", "Color": "Blue" },
 * //   { "Size": "M", "Color": "Red" },
 * //   { "Size": "M", "Color": "Blue" }
 * // ]
 */
export function generateVariantCombinations(
  options: ProductOption[]
): Record<string, string>[] {
  if (options.length === 0) return [];
  
  // Filter out options with no values
  const validOptions = options.filter(opt => opt.values.length > 0);
  if (validOptions.length === 0) return [];
  
  const combinations: Record<string, string>[] = [];
  
  function generate(index: number, current: Record<string, string>) {
    if (index === validOptions.length) {
      combinations.push({ ...current });
      return;
    }
    
    const option = validOptions[index];
    for (const value of option.values) {
      current[option.name] = value;
      generate(index + 1, current);
      delete current[option.name];
    }
  }
  
  generate(0, {});
  return combinations;
}

/**
 * Format option values for display
 * @example
 * formatOptionValues({ "Size": "M", "Color": "Red" })
 * // Returns: "Size: M / Color: Red"
 */
export function formatOptionValues(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ');
}

/**
 * Generate a variant SKU from base SKU and option combination
 * @example
 * generateVariantSKU("TSHIRT", { "Size": "Medium", "Color": "Red" })
 * // Returns: "TSHIRT-MED-RED"
 */
export function generateVariantSKU(
  baseSku: string,
  combo: Record<string, string>
): string {
  if (!baseSku) baseSku = 'VAR';
  
  const suffix = Object.values(combo)
    .map(v => v.substring(0, 3).toUpperCase())
    .join('-');
  
  return suffix ? `${baseSku}-${suffix}` : baseSku;
}

/**
 * Compare two option value objects for equality
 */
export function areOptionValuesEqual(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    if (a[keysA[i]] !== b[keysB[i]]) return false;
  }
  
  return true;
}
