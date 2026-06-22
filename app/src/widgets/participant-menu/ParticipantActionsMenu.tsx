import { canChangeRoles, canManageGroup } from '@/entities/chat';
import type { ChatListItem, ChatParticipant } from '@/entities/chat';
import { Alert, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';

type ParticipantActionsMenuProps = {
  participant: ChatParticipant;
  chat: ChatListItem;
  currentUserId?: string;
  onRemove: (userId: string) => void;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
};

export function ParticipantActionsMenu({
  participant,
  chat,
  currentUserId,
  onRemove,
  onPromote,
  onDemote,
}: ParticipantActionsMenuProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (participant.userId === currentUserId) {
    return null;
  }

  const canManage = canManageGroup(chat, currentUserId);
  const canManageRoles = canChangeRoles(chat, currentUserId);

  if (!canManage && !canManageRoles) {
    return null;
  }

  const openMenu = () => {
    const options: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [];

    if (canManageRoles && !participant.isOwner) {
      if (participant.role === 'member') {
        options.push({
          text: t('groups.makeAdmin'),
          onPress: () => onPromote(participant.userId),
        });
      } else {
        options.push({
          text: t('groups.removeAdmin'),
          onPress: () => onDemote(participant.userId),
        });
      }
    }

    if (canManage && !participant.isOwner) {
      options.push({
        text: t('groups.removeParticipant'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('groups.removeParticipantTitle'),
            t('groups.removeParticipantMessage', { name: participant.name }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('groups.removeParticipant'),
                style: 'destructive',
                onPress: () => onRemove(participant.userId),
              },
            ],
          );
        },
      });
    }

    if (options.length === 0) {
      return;
    }

    options.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(participant.name, undefined, options);
  };

  return (
    <Pressable onPress={openMenu} hitSlop={8} style={{ padding: 4 }}>
      <MaterialCommunityIcons
        name="dots-vertical"
        size={22}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}
