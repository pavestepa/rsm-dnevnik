import { CountryPicker } from '@/shared/ui/auth/CountryPicker';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import {
  formatPhoneDisplay,
  getCountryByCode,
} from '@/shared/lib/countries';
import { formatPhoneInputE164 } from '@/shared/lib/phone-normalize';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AddContactModalProps = {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (phone: string, displayName?: string) => void;
};

export function AddContactModal({
  visible,
  saving = false,
  onClose,
  onSubmit,
}: AddContactModalProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [countryCode, setCountryCode] = useState('RU');
  const [phoneNational, setPhoneNational] = useState('');
  const [displayName, setDisplayName] = useState('');

  const country = getCountryByCode(countryCode);
  const digits = phoneNational.replace(/\D/g, '');
  const canSubmit = digits.length >= 10 && !saving;

  useEffect(() => {
    if (!visible) {
      setPhoneNational('');
      setDisplayName('');
      setCountryCode('RU');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(
      formatPhoneInputE164(country.dialCode, digits, country.code),
      displayName.trim() || undefined,
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t('contacts.addTitle')}
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('contacts.phoneLabel')}
          </Text>
          <View style={styles.phoneRow}>
            <CountryPicker
              selectedCode={countryCode}
              onSelect={(selected) => setCountryCode(selected.code)}
            />
            <TextInput
              value={phoneNational}
              onChangeText={setPhoneNational}
              keyboardType="phone-pad"
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.phoneInput,
                { color: colors.text, backgroundColor: colors.inputBackground },
              ]}
            />
          </View>

          {digits.length >= 10 ? (
            <Text style={[styles.preview, { color: colors.textSecondary }]}>
              {formatPhoneDisplay(country.dialCode, digits)}
            </Text>
          ) : null}

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('contacts.nameLabel')}
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('contacts.namePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.nameInput,
              {
                color: colors.text,
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            maxLength={128}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={styles.actionButton}>
              <Text style={{ color: colors.textSecondary }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={styles.actionButton}
            >
              {saving ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('contacts.addButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  preview: {
    fontSize: 13,
  },
  nameInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 72,
    alignItems: 'center',
  },
});
