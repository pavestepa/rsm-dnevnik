import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type EditGroupTitleModalProps = {
  visible: boolean;
  title: string;
  value: string;
  saving?: boolean;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function EditGroupTitleModal({
  visible,
  title,
  value,
  saving = false,
  onChangeTitle,
  onClose,
  onSave,
}: EditGroupTitleModalProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeTitle}
            placeholder={t('groups.titlePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            autoFocus
            maxLength={128}
          />
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.actionButton}>
              <Text style={{ color: colors.textSecondary }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving || !value.trim()}
              style={styles.actionButton}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {t('settings.save')}
              </Text>
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
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
