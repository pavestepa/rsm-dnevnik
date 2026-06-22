import { ChatAvatar } from '@/entities/chat';
import { EditGroupTitleModal } from '@/widgets/group-modals';
import { ParticipantActionsMenu } from '@/widgets/participant-menu';
import { useLeaveGroup, useUpdateGroup } from '@/features/create-new-group';
import { useKickUser } from '@/features/kick-user';
import { useChangeRole } from '@/features/change-role';
import { useChatDetail } from '@/features/show-chat-data';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import {
  canManageGroup,
  getParticipantRoleLabel,
} from '@/entities/chat';
import type { ChatsStackScreenProps } from '@/app/navigation/types';
import { useAuthStore } from '@/entities/session';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function ChatInfoScreen({ navigation, route }: ChatsStackScreenProps<'ChatInfo'>) {
  const { chatId } = route.params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const chatQuery = useChatDetail(chatId);
  const updateGroup = useUpdateGroup(chatId);
  const removeParticipant = useKickUser(chatId);
  const updateParticipantRole = useChangeRole(chatId);
  const leaveGroup = useLeaveGroup(chatId);

  const [editTitleVisible, setEditTitleVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  if (chatQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (chatQuery.isError || !chatQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger }}>{t('chats.loadError')}</Text>
      </View>
    );
  }

  const chat = chatQuery.data;
  const isGroup = chat.type === 'group';
  const peer = isGroup
    ? null
    : chat.participants.find((participant) => participant.userId === chat.peerUserId);
  const canManage = canManageGroup(chat, currentUserId);

  const roleLabels = {
    owner: t('groups.owner'),
    admin: t('groups.admin'),
    member: t('groups.member'),
  };

  const openEditTitle = () => {
    setDraftTitle(chat.title ?? chat.displayName);
    setEditTitleVisible(true);
  };

  const handleSaveTitle = async () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      return;
    }

    try {
      await updateGroup.mutateAsync({ title: trimmed });
      setEditTitleVisible(false);
    } catch {
      Alert.alert(t('groups.updateFailedTitle'), t('groups.updateFailedMessage'));
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(t('groups.leaveTitle'), t('groups.leaveMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.leaveConfirm'),
        style: 'destructive',
        onPress: () => {
          void leaveGroup.mutateAsync().then(() => {
            navigation.popToTop();
          });
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <ChatAvatar
            name={chat.displayName}
            avatarUrl={chat.avatarUrl}
            isOnline={!isGroup && chat.isOnline}
            size={112}
          />
          <Text style={[styles.name, { color: colors.text }]}>{chat.displayName}</Text>
          {!isGroup && peer?.phone ? (
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{peer.phone}</Text>
          ) : null}
          {isGroup ? (
            <Text style={[styles.phone, { color: colors.textSecondary }]}>
              {t('chats.participantsCount', { count: chat.participants.length })}
            </Text>
          ) : null}
        </View>

        {isGroup && canManage ? (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Pressable
              onPress={openEditTitle}
              style={({ pressed }) => [
                styles.actionRow,
                { backgroundColor: pressed ? colors.surface : colors.card },
              ]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t('groups.editTitle')}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => navigation.navigate('AddParticipants', { chatId })}
              style={({ pressed }) => [
                styles.actionRow,
                { backgroundColor: pressed ? colors.surface : colors.card },
              ]}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t('groups.addParticipants')}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: colors.card, marginTop: isGroup ? 16 : 0 }]}>
          <Pressable
            onPress={() => navigation.navigate('ChatMedia', { chatId })}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: pressed ? colors.surface : colors.card },
            ]}
          >
            <MaterialCommunityIcons name="image-multiple" size={22} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t('chats.mediaLink')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {isGroup ? (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('chats.participants')}
            </Text>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              {chat.participants.map((participant, index) => {
                const roleLabel = getParticipantRoleLabel(participant, roleLabels);
                const isLast = index === chat.participants.length - 1;

                return (
                  <View
                    key={participant.id}
                    style={[
                      styles.participantRow,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                        backgroundColor: colors.card,
                      },
                    ]}
                  >
                    <ChatAvatar
                      name={participant.name}
                      avatarUrl={participant.avatarUrl}
                      size={44}
                    />
                    <View style={styles.participantText}>
                      <Text style={[styles.participantName, { color: colors.text }]}>
                        {participant.name}
                        {participant.userId === currentUserId ? ` (${t('chats.you')})` : ''}
                      </Text>
                      {participant.phone ? (
                        <Text style={[styles.participantPhone, { color: colors.textSecondary }]}>
                          {participant.phone}
                        </Text>
                      ) : null}
                    </View>
                    {roleLabel ? (
                      <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                          {roleLabel}
                        </Text>
                      </View>
                    ) : null}
                    <ParticipantActionsMenu
                      participant={participant}
                      chat={chat}
                      currentUserId={currentUserId}
                      onRemove={(userId) => void removeParticipant.mutateAsync(userId)}
                      onPromote={(userId) =>
                        void updateParticipantRole.mutateAsync({
                          targetUserId: userId,
                          role: 'admin',
                        })
                      }
                      onDemote={(userId) =>
                        void updateParticipantRole.mutateAsync({
                          targetUserId: userId,
                          role: 'member',
                        })
                      }
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ) : peer ? (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('chats.aboutContact')}
            </Text>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('settings.phoneLabel')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {peer.phone ?? '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('chats.status')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {chat.isOnline ? t('chats.online') : t('chats.offline')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {isGroup ? (
          <Pressable
            onPress={handleLeaveGroup}
            style={({ pressed }) => [
              styles.leaveButton,
              {
                backgroundColor: pressed ? colors.surface : colors.background,
              },
            ]}
          >
            <Text style={[styles.leaveText, { color: colors.danger }]}>
              {t('groups.leaveConfirm')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <EditGroupTitleModal
        visible={editTitleVisible}
        title={t('groups.editTitle')}
        value={draftTitle}
        saving={updateGroup.isPending}
        onChangeTitle={setDraftTitle}
        onClose={() => setEditTitleVisible(false)}
        onSave={() => void handleSaveTitle()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    gap: 8,
  },
  name: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  phone: {
    fontSize: 15,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  participantsSection: {
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    marginHorizontal: 20,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantText: {
    flex: 1,
    gap: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantPhone: {
    fontSize: 14,
  },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  leaveButton: {
    marginTop: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  leaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
