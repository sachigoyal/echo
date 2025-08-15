export const formatCurrency = (amount: number) => {
  if (amount < 0.01) {
    return '< $0.01';
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: amount < 0.01 ? 2 : 2,
    style: 'currency',
    currency: 'usd',
  });
};

/**
 * Format a percentage value with proper precision handling
 * @param percentage - The percentage value to format
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  percentage: number,
  precision: number = 2
): string => {
  // Handle edge cases
  if (isNaN(percentage) || !isFinite(percentage)) {
    return '0%';
  }

  // Round to avoid floating point precision issues
  const rounded =
    Math.round(percentage * Math.pow(10, precision)) / Math.pow(10, precision);

  // Format with appropriate decimal places
  if (rounded === Math.floor(rounded) && precision >= 1) {
    // Show whole numbers without decimals for cleaner display
    return `${Math.floor(rounded)}%`;
  }

  return `${rounded.toFixed(precision)}%`;
};

/**
 * Convert multiplier to percentage with proper precision
 * @param multiplier - The multiplier value (e.g., 1.05 = 5%)
 * @returns Percentage value
 */
export const multiplierToPercentage = (multiplier: number): number => {
  if (isNaN(multiplier) || !isFinite(multiplier)) {
    return 0;
  }

  // Use precise calculation to avoid floating point issues
  const percentage = Math.max(0, (multiplier - 1) * 100);

  // Round to 2 decimal places to handle floating point precision
  return Math.round(percentage * 100) / 100;
};

/**
 * Convert percentage to multiplier with proper precision
 * @param percentage - The percentage value (e.g., 5 = 1.05 multiplier)
 * @returns Multiplier value
 */
export const percentageToMultiplier = (percentage: number): number => {
  if (isNaN(percentage) || !isFinite(percentage)) {
    return 1;
  }

  // Use precise calculation and round to avoid floating point issues
  const multiplier = percentage / 100 + 1;

  // Round to 6 decimal places for multiplier precision
  return Math.round(multiplier * 1000000) / 1000000;
};

/**
 * Safely parse a string to number with fallback
 * @param value - String value to parse
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed number or fallback
 */
export const safeParseFloat = (value: string, fallback: number = 0): number => {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Check if two percentage values are effectively equal (within tolerance)
 * @param a - First percentage value
 * @param b - Second percentage value
 * @param tolerance - Tolerance for comparison (default: 0.01)
 * @returns True if values are within tolerance
 */
export const arePercentagesEqual = (
  a: number,
  b: number,
  tolerance: number = 0.01
): boolean => {
  return Math.abs(a - b) <= tolerance;
};

/**
 * Validate percentage input value
 * @param value - String value to validate
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 1000)
 * @returns Validation result with error message if invalid
 */
export const validatePercentage = (
  value: string,
  min: number = 0,
  max: number = 1000
): { isValid: boolean; error?: string; value?: number } => {
  if (value.trim() === '') {
    return { isValid: false, error: 'Please enter a value' };
  }

  const parsed = parseFloat(value);

  if (isNaN(parsed)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (parsed < min) {
    return { isValid: false, error: `Value must be ${min}% or higher` };
  }

  if (parsed > max) {
    return { isValid: false, error: `Value cannot exceed ${max}%` };
  }

  return { isValid: true, value: parsed };
};
