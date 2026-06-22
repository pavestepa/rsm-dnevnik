import {
  countries,
  getCountryByCode,
  type Country,
} from '@/shared/lib/countries';
import { useAppTheme } from '@/shared/lib/hooks/useAppTheme';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type CountryPickerProps = {
  selectedCode: string;
  onSelect: (country: Country) => void;
};

export function CountryPicker({ selectedCode, onSelect }: CountryPickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = getCountryByCode(selectedCode);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return countries;
    }

    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(normalized) ||
        country.dialCode.includes(normalized) ||
        country.code.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, { borderBottomColor: colors.border }]}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={[styles.dialCode, { color: colors.text }]}>
          +{selected.dialCode}
        </Text>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>▾</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('auth.selectCountry')}
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('auth.searchCountry')}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.search,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                  setQuery('');
                }}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <Text style={styles.rowFlag}>{item.flag}</Text>
                <Text style={[styles.rowName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.rowDial, { color: colors.textSecondary }]}>
                  +{item.dialCode}
                </Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setVisible(false)} style={styles.closeWrap}>
            <Text style={{ color: colors.link }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginRight: 12,
    minWidth: 96,
  },
  flag: {
    fontSize: 22,
    marginRight: 6,
  },
  dialCode: {
    fontSize: 18,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
    fontSize: 14,
  },
  modal: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowFlag: {
    fontSize: 22,
    width: 36,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
  },
  rowDial: {
    fontSize: 15,
  },
  closeWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});
