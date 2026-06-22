import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { whatsAppGreen } from '@/shared/theme/colors';
import { type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export function AuthScreen({
  children,
  style,
  edges = ['left', 'right', 'bottom'],
}: PropsWithChildren<{ style?: ViewStyle; edges?: Edge[] }>) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export function AuthTitle({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <Text style={[styles.title, { color: colors.text }]}>{children}</Text>;
}

export function AuthSubtitle({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{children}</Text>
  );
}

export function AuthInput(props: TextInputProps) {
  const { colors } = useAppTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={[
        styles.input,
        {
          color: colors.text,
          borderBottomColor: colors.border,
          backgroundColor: colors.inputBackground,
        },
        props.style,
      ]}
    />
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: whatsAppGreen,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.link, { color: colors.link }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthFooter({ children }: PropsWithChildren) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    fontSize: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
    alignItems: 'center',
  },
});
