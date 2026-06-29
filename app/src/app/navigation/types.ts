import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  Phone: undefined;
  Otp: {
    phoneE164: string;
    formattedPhone: string;
  };
};

export type ProfileStackParamList = {
  ProfileSetup: undefined;
  AvatarUpload: undefined;
};

export type MainTabParamList = {
  DiaryTab: undefined;
  ChatsTab: undefined;
  ContactsTab: undefined;
  ProfileTab: undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
};

export type ChatsStackParamList = {
  ChatList: undefined;
  CreateGroup: undefined;
  AddParticipants: { chatId: string };
  Chat: { chatId: string; typingSubtitle?: string };
  ChatInfo: { chatId: string };
  EditGroup: { chatId: string };
  ChatMedia: { chatId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type DiaryStackParamList = {
  DiaryList: undefined;
  Event: { eventId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventChat: { chatId: string; typingSubtitle?: string };
  EventGallery: {
    images: Array<{ id: string; url: string }>;
    initialIndex: number;
  };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type ChatsStackScreenProps<T extends keyof ChatsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ChatsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<SettingsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type ContactsStackScreenProps<T extends keyof ContactsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ContactsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type DiaryStackScreenProps<T extends keyof DiaryStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<DiaryStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;
