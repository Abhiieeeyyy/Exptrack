/**
 * Indian Rupee (INR) formatting and calculation utilities
 * Compliant with FECMS Build Plan specifications (DECIMAL(12,2) with Indian digit grouping)
 */

/**
 * Format a number as Indian Rupee string (e.g. ₹1,50,000.00 or ₹1,50,000)
 * @param {number|string} amount
 * @param {boolean} includeDecimals
 * @returns {string}
 */
export function formatINR(amount, includeDecimals = false) {
  const num = Number(amount) || 0;
  
  const options = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  };

  try {
    return new Intl.NumberFormat('en-IN', options).format(num);
  } catch {
    // Fallback if Intl is unavailable
    const parts = num.toFixed(includeDecimals ? 2 : 0).split('.');
    let intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    
    const isNegative = intPart.startsWith('-');
    if (isNegative) intPart = intPart.substring(1);

    let lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return (isNegative ? '-₹' : '₹') + res + decPart;
  }
}

/**
 * Format a number into compact Indian denomination (e.g. ₹1.5 L, ₹12 K, ₹3.4 Cr)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatINRCompact(amount) {
  const num = Math.abs(Number(amount) || 0);
  const sign = Number(amount) < 0 ? '-' : '';

  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)} k`;
  }
  return `${sign}₹${num.toLocaleString('en-IN')}`;
}

/**
 * Clean and parse numeric input
 * @param {string|number} value
 * @returns {number}
 */
export function parseAmount(value) {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}
