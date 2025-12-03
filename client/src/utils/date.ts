// File Location: client/src/utils/date.ts

/**
 * Formats a date string (e.g., "2024-10-15T00:00:00.000Z") into a readable format.
 * Example: "October 15, 2024"
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Assume dates from DB are UTC to prevent off-by-one day errors
  }).format(date);
};

/**
 * Calculates the number of days until a given expiry date from today.
 * Returns a negative number if the date has already passed.
 */
export const getDaysUntilExpiry = (expiryDateString: string | Date): number => {
  if (!expiryDateString) return Infinity;

  const expiryDate = new Date(expiryDateString);
  if (isNaN(expiryDate.getTime())) {
    return Infinity; // Return a large number for invalid dates
  }

  // Get the current date and set it to the start of the day for an accurate comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds and convert to days
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};