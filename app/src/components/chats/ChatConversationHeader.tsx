import { HeaderBackButton } from '@/components/branding/HeaderBackButton';
import { ChatHeaderTitle } from '@/components/chats/ChatHeaderTitle';
import { useChatDetail } from '@/hooks/useChatDetail';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ChatsStackParamList } from '@/navigation/types';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatRouteParams = ChatsStackParamList['Chat'];

export function ChatConversationHeader({
  navigation,
  route,
  back,
}: NativeStackHeaderProps) {
  const params = route.params as ChatRouteParams;
  const { chatId, typingSubtitle } = params;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const chatQuery = useChatDetail(chatId);

  const openInfo = () => {
    navigation.navigate('ChatInfo', { chatId });
  };

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
});
