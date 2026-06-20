export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const DEFAULT_COUNTRY_CODE = 'RU';

export const countries: Country[] = [
  { code: 'RU', name: 'Россия', dialCode: '7', flag: '🇷🇺' },
  { code: 'KZ', name: 'Казахстан', dialCode: '7', flag: '🇰🇿' },
  { code: 'BY', name: 'Беларусь', dialCode: '375', flag: '🇧🇾' },
  { code: 'UA', name: 'Украина', dialCode: '380', flag: '🇺🇦' },
  { code: 'UZ', name: 'Узбекistan', dialCode: '998', flag: '🇺🇿' },
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dialCode: '49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '33', flag: '🇫🇷' },
  { code: 'TR', name: 'Turkey', dialCode: '90', flag: '🇹🇷' },
  { code: 'AE', name: 'UAE', dialCode: '971', flag: '🇦🇪' },
  { code: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳' },
];

export function getCountryByCode(code: string): Country {
  return countries.find((country) => country.code === code) ?? countries[0];
}

export function formatPhoneE164(dialCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  return `+${dialCode}${digits}`;
}

export function formatPhoneDisplay(dialCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, '');
  return `+${dialCode} ${digits}`;
}
