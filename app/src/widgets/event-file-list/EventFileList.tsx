import type { EventFile } from '@/entities/event';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type EventFileListProps = {
  files: EventFile[];
  onFilePress: (file: EventFile) => void;
};

export function EventFileList({ files, onFilePress }: EventFileListProps) {
  const { colors } = useAppTheme();

  if (files.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {files.map((file) => (
        <Pressable
          key={file.id}
          onPress={() => onFilePress(file)}
          style={({ pressed }) => [
            styles.cell,
            { backgroundColor: pressed ? colors.surface : colors.card },
          ]}
        >
          <MaterialCommunityIcons name="file-outline" size={28} color={colors.primary} />
          <Text
            style={[styles.fileName, { color: colors.text }]}
            numberOfLines={2}
          >
            {file.fileName}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '30%',
    minWidth: 96,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  fileName: {
    fontSize: 11,
    textAlign: 'center',
  },
});
