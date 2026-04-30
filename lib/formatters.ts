export const formatOP = (op: string): string => {
  if (!op) return '';
  const cleaned = op.toUpperCase().trim();
  
  // Case 1: Already has a dash between numbers (e.g. 410-152) -> just cleanup
  if (cleaned.includes('-')) {
    return cleaned.replace(/\s+/g, '').replace(/-+/g, '-');
  }

  // Case 2: Numbers separated by spaces or dots (e.g. 410 152) -> Replace with dash
  if (/[0-9][\s.][0-9]/.test(cleaned)) {
    return cleaned.replace(/[\s.]+/g, '-');
  }

  // Case 3: Pure sequence of 6 or more digits (e.g. 410152) -> Split after 3rd
  if (/^\d{6,}$/.test(cleaned)) {
    return cleaned.replace(/^(\d{3})(\d+)/, '$1-$2');
  }

  return cleaned;
};
