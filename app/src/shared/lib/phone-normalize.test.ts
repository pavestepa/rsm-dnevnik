import {
  contactMatchesQuery,
  normalizePhoneE164,
  phonesEqual,
} from './phone-normalize';

describe('phone-normalize', () => {
  it('normalizes Russian numbers to E.164', () => {
    expect(normalizePhoneE164('89001111111')).toBe('+79001111111');
    expect(normalizePhoneE164('+7 900 111-11-11')).toBe('+79001111111');
  });

  it('compares phones after normalization', () => {
    expect(phonesEqual('89001111111', '+79001111111')).toBe(true);
    expect(phonesEqual('+79001111111', '+79002222222')).toBe(false);
  });

  it('matches contacts by name or phone digits', () => {
    const contact = {
      displayName: 'Alice',
      phone: '+79001111111',
      matchedUserName: 'Alice User',
    };

    expect(contactMatchesQuery(contact, 'ali')).toBe(true);
    expect(contactMatchesQuery(contact, '900111')).toBe(true);
    expect(contactMatchesQuery(contact, 'bob')).toBe(false);
  });
});
