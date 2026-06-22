import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { emitTypingStart, emitTypingStop } from '@/shared/lib/socket/chat-socket';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type MessageComposerProps = {
  chatId: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
};

export function MessageComposer({
  chatId,
  value,
  onChangeText,
  onSend,
  sending = false,
  disabled = false,
}: MessageComposerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (typingRef.current) {
      typingRef.current = false;
      emitTypingStop(chatId);
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [chatId]);

  const handleChangeText = (text: string) => {
    onChangeText(text);

    if (!text.trim()) {
      stopTyping();
      return;
    }

    if (!typingRef.current) {
      typingRef.current = true;
      emitTypingStart(chatId);
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 2500);
  };

  const handleSend = () => {
    if (!value.trim() || sending || disabled) {
      return;
    }

    stopTyping();
    onSend();
  };

  const canSend = value.trim().length > 0 && !sending && !disabled;

  return (
    <View style={[styles.bar, { backgroundColor: colors.chatComposerBar, borderTopColor: colors.border }]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.chatComposerInput }]}>
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={t('chats.messagePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
          multiline
          maxLength={4096}
          editable={!disabled}
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: canSend ? colors.primary : colors.surface,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={canSend ? colors.white : colors.textSecondary}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 96,
    padding: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
