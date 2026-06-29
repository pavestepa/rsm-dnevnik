import type { EventImage } from '@/entities/event';
import { resolveMediaUrl } from '@/entities/media';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type EventImageGridProps = {
  images: EventImage[];
  totalImages: number;
  onImagePress: (index: number) => void;
};

const MAX_VISIBLE = 4;

export function EventImageGrid({ images, totalImages, onImagePress }: EventImageGridProps) {
  const { colors } = useAppTheme();
  const visible = images.slice(0, MAX_VISIBLE);
  const overflow = totalImages - MAX_VISIBLE;

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {visible.map((image, index) => {
        const isLast = index === MAX_VISIBLE - 1;
        const showOverlay = isLast && overflow > 0;
        const uri = resolveMediaUrl(image.url);

        return (
          <Pressable
            key={image.id}
            onPress={() => onImagePress(index)}
            style={styles.cell}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, { backgroundColor: colors.surface }]} />
            )}
            {showOverlay ? (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>+{overflow}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
