import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'РСМ Дневник',
  slug: 'rsm-dnevnik',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'rsm-dnevnik',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rsmdnevnik.app',
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: true,
      NSContactsUsageDescription:
        'Разрешите доступ к контактам, чтобы найти друзей, которые используют приложение.',
    },
  },
  android: {
    package: 'com.rsmdnevnik.app',
    adaptiveIcon: {
      backgroundColor: '#0066FF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['READ_CONTACTS'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-dev-client',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0066FF',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow access to your photos to set a profile picture.',
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Разрешите доступ к контактам, чтобы найти друзей, которые используют приложение.',
      },
    ],
  ],
};

export default config;
