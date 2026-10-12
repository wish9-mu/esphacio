const PH_MOBILE = /^(?:\+?63|0)?9\d{9}$/;

export function normalizePhilippineMobile(input: string): string | null {
  const compact = input.trim().replace(/[\s()-]/g, '');
  if (!PH_MOBILE.test(compact)) return null;
  const digits = compact.replace(/^\+/, '');
  if (digits.startsWith('63')) return `+${digits}`;
  if (digits.startsWith('0')) return `+63${digits.slice(1)}`;
  return `+63${digits}`;
}

export function isPhilippineMobile(input: string): boolean {
  return normalizePhilippineMobile(input) !== null;
}
