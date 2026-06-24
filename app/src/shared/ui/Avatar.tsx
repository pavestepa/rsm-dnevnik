import { resolveMediaUrl } from '@/shared/lib/media-url';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { Image, StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  name: string;
  avatarUrl: string | null;
  isOnline?: boolean;
  size?: number;
};

export function Avatar({
  name,
  avatarUrl,
  isOnline = false,
  size = 56,
}: AvatarProps) {
  const { colors } = useAppTheme();
  const radius = size / 2;
  const onlineSize = Math.max(12, Math.round(size * 0.25));
  const resolvedAvatarUrl = resolveMediaUrl(avatarUrl);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {resolvedAvatarUrl ? (
        <Image
          source={{ uri: resolvedAvatarUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.38, color: colors.textSecondary }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {isOnline ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              borderWidth: 2,
              borderColor: colors.background,
              backgroundColor: colors.online,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#E9EDEF',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
  },
});
