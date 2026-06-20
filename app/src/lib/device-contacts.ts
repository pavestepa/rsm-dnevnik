import * as Contacts from 'expo-contacts';
import { normalizePhoneE164 } from '@/lib/phone-normalize';
import type { SyncContactItem } from '@/types/contact';

export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function readDeviceContactsForSync(): Promise<SyncContactItem[]> {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });

    const byPhone = new Map<string, SyncContactItem>();

    for (const contact of data) {
      const displayName = contact.name?.trim() || 'Contact';

      for (const phoneEntry of contact.phoneNumbers ?? []) {
        const raw = phoneEntry.number?.trim();
        if (!raw) {
          continue;
        }

        const phone = normalizePhoneE164(raw, 'RU');
        if (phone.length < 8) {
          continue;
        }

        if (!byPhone.has(phone)) {
          byPhone.set(phone, { phone, displayName });
        }
      }
    }

    return [...byPhone.values()].slice(0, 500);
  } catch {
    return [];
  }
}
