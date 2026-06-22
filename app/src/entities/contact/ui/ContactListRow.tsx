import { ChatAvatar } from '@/entities/chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { Contact } from '@/entities/contact';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type ContactListRowProps = {
  contact: Contact;
  mode?: 'single' | 'multi' | 'list';
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ContactListRow({
  contact,
  mode = 'list',
  selected = false,
  disabled = false,
  onPress,
}: ContactListRowProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const avatarName = contact.matchedUserName ?? contact.displayName;
  const avatarUrl = contact.matchedUserAvatarUrl;
  const subtitle = contact.isRegistered
    ? contact.matchedUserName && contact.matchedUserName !== contact.displayName
      ? `${contact.displayName} · ${contact.phone}`
      : contact.phone
    : contact.phone;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surface : colors.background,
          borderBottomColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <ChatAvatar name={avatarName} avatarUrl={avatarUrl} size={48} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]}>
          {contact.matchedUserName ?? contact.displayName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {mode === 'multi' ? (
        selected ? (
          <MaterialCommunityIcons name="check-circle" size={26} color={colors.primary} />
        ) : (
          <View style={[styles.plusBadge, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
          </View>
        )
      ) : mode === 'list' ? (
        contact.isRegistered ? (
          <Text style={[styles.badge, { color: colors.primary }]}>
            {t('contacts.inChat')}
          </Text>
        ) : (
          <Text style={[styles.badgeMuted, { color: colors.textSecondary }]}>
            {t('contacts.notInApp')}
          </Text>
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
  },
  plusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMuted: {
    fontSize: 12,
    maxWidth: 88,
    textAlign: 'right',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 88,
    textAlign: 'right',
  },
});
