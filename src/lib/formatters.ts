/**
 * Formats an ex-showroom price in Indian numbering system (Lakhs and Crores)
 * e.g. 1480000 -> ₹14.80 Lakh, 3098000 -> ₹30.98 Lakh, 11000000 -> ₹1.10 Cr
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return 'Price on Request';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'Price on Request';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Format raw currency with commas (INR)
 */
export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Render star icons array
 */
export function getStarArray(rating: number | null | undefined): { filled: boolean; half: boolean }[] {
  const r = rating ? Math.max(0, Math.min(5, Number(rating))) : 0;
  const stars: { filled: boolean; half: boolean }[] = [];
  for (let i = 1; i <= 5; i++) {
    if (r >= i) {
      stars.push({ filled: true, half: false });
    } else if (r >= i - 0.5) {
      stars.push({ filled: false, half: true });
    } else {
      stars.push({ filled: false, half: false });
    }
  }
  return stars;
}
