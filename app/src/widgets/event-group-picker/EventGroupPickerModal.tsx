import { ChatAvatar } from '@/entities/chat';
import type { ChatListItem } from '@/entities/chat';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type EventGroupPickerModalProps = {
  visible: boolean;
  groups: ChatListItem[];
  loading?: boolean;
  onSelect: (groupId: string) => void;
  onClose: () => void;
};

export function EventGroupPickerModal({
  visible,
  groups,
  loading = false,
  onSelect,
  onClose,
}: EventGroupPickerModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Выберите группу</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {groups.map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => onSelect(group.id)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? colors.surface : colors.card },
                  ]}
                >
                  <ChatAvatar
                    name={group.displayName}
                    avatarUrl={group.avatarUrl}
                    size={44}
                  />
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
