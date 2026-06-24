import { HeaderBackButton } from '@/shared/ui/logo/HeaderBackButton';
import { ChatHeaderTitle } from '@/widgets/chat-header';
import { useChatDetail } from '@/features/show-chat-data';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { canManageGroup } from '@/entities/chat';
import type { ChatsStackParamList } from '@/app/navigation/types';
import { useAuthStore } from '@/entities/session';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatRouteParams = ChatsStackParamList['Chat'];

export function ChatConversationHeader({
  navigation,
  route,
  back,
}: NativeStackHeaderProps) {
  const params = route.params as ChatRouteParams;
  const { chatId, typingSubtitle } = params;
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const chatQuery = useChatDetail(chatId);

  const openInfo = () => {
    navigation.navigate('ChatInfo', { chatId });
  };

  const openGroupMenu = () => {
    if (!chatQuery.data || chatQuery.data.type !== 'group') {
      return;
    }

    const canManage = canManageGroup(chatQuery.data, currentUserId);
    const options: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      {
        text: t('chats.infoTitle'),
        onPress: () => navigation.navigate('ChatInfo', { chatId }),
      },
    ];

    if (canManage) {
      options.push({
        text: t('groups.editGroup'),
        onPress: () => navigation.navigate('EditGroup', { chatId }),
      });
    }

    options.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(chatQuery.data.displayName, undefined, options);
  };

  const isGroup = chatQuery.data?.type === 'group';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <HeaderBackButton canGoBack={Boolean(back)} />
        <TouchableOpacity
          style={styles.titleArea}
          activeOpacity={0.7}
          onPress={openInfo}
          disabled={!chatQuery.data}
        >
          {chatQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : chatQuery.data ? (
            <ChatHeaderTitle chat={chatQuery.data} subtitle={typingSubtitle} />
          ) : null}
        </TouchableOpacity>
        {isGroup ? (
          <Pressable onPress={openGroupMenu} hitSlop={8} style={styles.menuButton}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: 16,
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  menuButton: {
    padding: 4,
  },
});
