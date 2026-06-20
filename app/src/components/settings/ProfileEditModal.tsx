import { AuthInput, PrimaryButton } from '@/components/auth/AuthLayout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { whatsAppTeal } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ProfileEditModalProps = {
  visible: boolean;
  title: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function ProfileEditModal({
  visible,
  title,
  value,
  placeholder,
  multiline = false,
  maxLength = 140,
  saving = false,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <AuthInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              autoCapitalize={multiline ? 'sentences' : 'words'}
              autoFocus
              maxLength={maxLength}
              multiline={multiline}
              style={multiline ? styles.multilineInput : undefined}
            />

            <PrimaryButton
              label={t('settings.save')}
              onPress={() => onSave(draft)}
              loading={saving}
              disabled={draft.trim().length === 0}
            />

            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  keyboardWrap: {
    width: '100%',
  },
  sheet: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
  },
});
