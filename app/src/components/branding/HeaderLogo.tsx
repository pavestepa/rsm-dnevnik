import { AppLogo } from '@/components/branding/AppLogo';
import { Platform, StyleSheet, View } from 'react-native';

export function HeaderLogo() {
  return (
    <View style={styles.wrap}>
      <AppLogo width={Platform.OS === 'ios' ? 52 : 48} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: Platform.OS === 'ios' ? 8 : 12,
    paddingRight: 4,
  },
});
