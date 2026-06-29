import type { EventListItem } from '@/entities/event';
import { groupEventsByDate } from '@/entities/event';
import { flattenEvents, useEvents } from '@/features/show-diary-list';
import { EventCard } from '@/widgets/event-card';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { getScrollContentProps } from '@/app/navigation/nativeHeaderOptions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DiaryListProps = {
  onPressEvent: (event: EventListItem) => void;
  onPressAuthor: (event: EventListItem) => void;
  onPressChat: (event: EventListItem) => void;
  listHeaderComponent?: ReactElement | null;
};

export function DiaryList({
  onPressEvent,
  onPressAuthor,
  onPressChat,
  listHeaderComponent,
}: DiaryListProps) {
  const { colors } = useAppTheme();
  const eventsQuery = useEvents();
  const events = flattenEvents(eventsQuery.data);
  const sections = useMemo(() => groupEventsByDate(events), [events]);
  const scrollProps = getScrollContentProps();

  if (eventsQuery.isLoading && !eventsQuery.data) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.chatWallpaper }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (eventsQuery.isError && !eventsQuery.data) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.chatWallpaper }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Не удалось загрузить записи
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.chatWallpaper }]}>
      <SectionList
        {...scrollProps}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeaderComponent ?? null}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.chatWallpaper }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <EventCard
              event={item}
              showDate={false}
              onPressCard={() => onPressEvent(item)}
              onPressAuthor={() => onPressAuthor(item)}
              onPressChat={() => onPressChat(item)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={eventsQuery.isFetching && !eventsQuery.isLoading}
            onRefresh={() => void eventsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
            void eventsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          eventsQuery.isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="book-open-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Записей пока нет</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Создайте первую запись в дневнике
            </Text>
          </View>
        }
        stickySectionHeadersEnabled
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
});
