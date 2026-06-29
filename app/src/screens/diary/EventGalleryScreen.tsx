import type { EventImage } from '@/entities/event';
import { resolveMediaUrl } from '@/entities/media';
import type { DiaryStackScreenProps } from '@/app/navigation/types';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EventGalleryScreen({ route }: DiaryStackScreenProps<'EventGallery'>) {
  const { images, initialIndex } = route.params;
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList<EventImage>>(null);

  const renderItem = ({ item }: ListRenderItemInfo<EventImage>) => {
    const uri = resolveMediaUrl(item.url);

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.surface }]} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
