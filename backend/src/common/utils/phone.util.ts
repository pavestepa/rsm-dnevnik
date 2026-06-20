export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  // Russia/Kazakhstan: 8XXXXXXXXXX → +7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }

  if (trimmed.startsWith('+') || digits.length > 10) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function phonesEqual(a: string, b: string): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return Boolean(left && right && left === right);
}
