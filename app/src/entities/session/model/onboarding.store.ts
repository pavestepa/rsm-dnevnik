import { DEFAULT_COUNTRY_CODE } from '@/shared/lib/countries';
import { create } from 'zustand';

interface OnboardingState {
  countryCode: string;
  phoneNational: string;
  profileName: string;
  profileBio: string;
  setCountryCode: (code: string) => void;
  setPhoneNational: (phone: string) => void;
  setProfileDraft: (name: string, bio: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  countryCode: DEFAULT_COUNTRY_CODE,
  phoneNational: '',
  profileName: '',
  profileBio: '',
  setCountryCode: (countryCode) => set({ countryCode }),
  setPhoneNational: (phoneNational) => set({ phoneNational }),
  setProfileDraft: (profileName, profileBio) => set({ profileName, profileBio }),
  reset: () =>
    set({
      countryCode: DEFAULT_COUNTRY_CODE,
      phoneNational: '',
      profileName: '',
      profileBio: '',
    }),
}));
