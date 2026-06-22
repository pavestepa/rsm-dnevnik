import { normalizePhone, phonesEqual } from './phone.util';

describe('phone.util', () => {
  it('normalizes Russian numbers starting with 8', () => {
    expect(normalizePhone('89001111111')).toBe('+79001111111');
  });

  it('normalizes numbers already in international format', () => {
    expect(normalizePhone('+7 900 111-11-11')).toBe('+79001111111');
  });

  it('compares normalized phone numbers', () => {
    expect(phonesEqual('89001111111', '+79001111111')).toBe(true);
    expect(phonesEqual('+79001111111', '+79002222222')).toBe(false);
  });
});
