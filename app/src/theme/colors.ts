/** Single source of truth for all app colors. */

export const brandBlue = '#0066FF';
export const brandBlueDark = '#004BB8';
export const brandBlueLight = '#EAF2FF';
export const brandBlueMuted = '#5C94FF';
export const brandBlueSoft = '#D6E8FF';
export const brandBlueWallpaper = '#E8EEF8';

export const palette = {
  primary: brandBlue,
  primaryDark: brandBlueDark,
  accent: brandBlue,
  success: '#22A06B',
  danger: '#EA0038',
  warning: '#FFB800',
  white: '#FFFFFF',
  black: '#0F172A',
} as const;

const lightChat = {
  chatWallpaper: brandBlueWallpaper,
  chatBubbleOutgoing: brandBlueSoft,
  chatBubbleIncoming: palette.white,
  chatBubbleOutgoingText: palette.black,
  chatBubbleIncomingText: palette.black,
  chatBubbleMeta: '#64748B',
  chatBubbleMetaOwn: brandBlueMuted,
  chatComposerBar: palette.white,
  chatComposerInput: '#F1F5FB',
  chatDatePill: palette.white,
  chatDatePillText: '#64748B',
  chatStatusSent: '#94A3B8',
  chatStatusRead: brandBlue,
  chatHeaderBar: palette.white,
  chatTyping: brandBlueMuted,
} as const;

const darkChat = {
  chatWallpaper: '#0E1628',
  chatBubbleOutgoing: '#1A3A6B',
  chatBubbleIncoming: '#152238',
  chatBubbleOutgoingText: '#E8EEF9',
  chatBubbleIncomingText: '#E8EEF9',
  chatBubbleMeta: '#8FA3C7',
  chatBubbleMetaOwn: brandBlueMuted,
  chatComposerBar: '#152238',
  chatComposerInput: '#1A2A42',
  chatDatePill: '#1A2A42',
  chatDatePillText: '#8FA3C7',
  chatStatusSent: '#8FA3C7',
  chatStatusRead: brandBlueMuted,
  chatHeaderBar: '#0B1220',
  chatTyping: brandBlueMuted,
} as const;

export const lightColors = {
  ...palette,
  background: palette.white,
  surface: '#EEF3FB',
  text: palette.black,
  textSecondary: '#64748B',
  border: '#DCE6F5',
  card: palette.white,
  tabBar: '#EEF3FB',
  inputBackground: palette.white,
  link: brandBlue,
  statusBar: 'dark' as const,
  online: brandBlue,
  unreadBadge: brandBlue,
  ...lightChat,
} as const;

export const darkColors = {
  ...palette,
  background: '#0B1220',
  surface: '#152238',
  text: '#E8EEF9',
  textSecondary: '#8FA3C7',
  border: '#243552',
  card: '#152238',
  tabBar: '#152238',
  inputBackground: '#152238',
  link: brandBlueMuted,
  statusBar: 'light' as const,
  online: brandBlueMuted,
  unreadBadge: brandBlue,
  ...darkChat,
} as const;

export type AppColors = typeof lightColors | typeof darkColors;

/** @deprecated use palette.primary or brandBlue */
export const whatsAppGreen = brandBlue;
/** @deprecated use brandBlueDark */
export const whatsAppDarkGreen = brandBlueDark;
/** @deprecated use brandBlueDark */
export const whatsAppTeal = brandBlueDark;
