import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { formatPhoneE164 as formatE164FromParts } from '@/constants/countries';

export function normalizePhoneE164(
  phone: string,
  defaultCountry: CountryCode = 'RU',
): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (parsed?.isValid()) {
    return parsed.format('E.164');
  }

  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function formatPhoneInputE164(
  dialCode: string,
  nationalNumber: string,
  countryCode: string = 'RU',
): string {
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const raw = `+${dialCode}${digits}`;
  const normalized = normalizePhoneE164(raw, countryCode as CountryCode);
  if (normalized) {
    return normalized;
  }

  return formatE164FromParts(dialCode, nationalNumber);
}

export function contactMatchesQuery(
  contact: { displayName: string; phone: string; matchedUserName?: string | null },
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const digits = normalized.replace(/\D/g, '');

  if (contact.displayName.toLowerCase().includes(normalized)) {
    return true;
  }

  if (contact.matchedUserName?.toLowerCase().includes(normalized)) {
    return true;
  }

  if (digits.length >= 1 && contact.phone.replace(/\D/g, '').includes(digits)) {
    return true;
  }

  return false;
}

export function phonesEqual(a: string, b: string): boolean {
  const left = normalizePhoneE164(a);
  const right = normalizePhoneE164(b);
  return Boolean(left && right && left === right);
}
