export type {
  ContactSource,
  Contact,
  CreateContactPayload,
  SyncContactItem,
  SyncContactsPayload,
} from './model/types';
export { contactsApi } from './api/contact.api';
export { ContactListRow } from './ui/ContactListRow';
export {
  readDeviceContactsForSync,
  requestContactsPermission,
} from './lib/device-contacts';
