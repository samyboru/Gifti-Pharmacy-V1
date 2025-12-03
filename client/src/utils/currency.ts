// File Location: client/src/utils/currency.ts

/**
 * Formats a numeric value into the ETB currency format with the code after the number.
 * @param value The number to format.
 * @returns A string representing the value in ETB currency (e.g., "100.00 ETB").
 */
export const formatCurrency = (value: number | null | undefined): string => {
  const numberToFormat = (value == null || isNaN(value)) ? 0 : value;

  // Format the number to always have two decimal places.
  const formattedNumber = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberToFormat);

  // Manually append the currency code with a space.
  return `${formattedNumber} ETB`;
};