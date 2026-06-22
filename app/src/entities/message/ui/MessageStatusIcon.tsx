import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import type { MessageDeliveryStatus } from '@/entities/message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

type MessageStatusIconProps = {
  status: MessageDeliveryStatus | null;
  isOwn: boolean;
};

export function MessageStatusIcon({ status, isOwn }: MessageStatusIconProps) {
  const { colors } = useAppTheme();

  if (!isOwn) {
    return null;
  }

  const resolvedStatus = status ?? 'sent';

  if (resolvedStatus === 'sent') {
    return (
      <MaterialCommunityIcons
        name="check"
        size={15}
        color={colors.chatStatusSent}
        style={styles.icon}
      />
    );
  }

  const isRead = resolvedStatus === 'read';

  return (
    <MaterialCommunityIcons
      name="check-all"
      size={15}
      color={isRead ? colors.chatStatusRead : colors.chatStatusSent}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    marginLeft: 3,
  },
});
