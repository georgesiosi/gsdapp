/**
 * Hook for managing user profile data and preferences
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { UserProfile } from "@/types/profile"

interface ProfileState {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  getPersonalContext: () => string
  initializeProfile: () => void
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (profile) => {
        // Ensure license status is set
        const status = profile.isLegacyUser ? 'legacy' : 
                      profile.licenseKey ? 'active' : 'inactive';
        set({ 
          profile: {
            ...profile,
            licenseStatus: status
          } 
        });
      },
      getPersonalContext: () => get().profile?.personalContext || "",
      initializeProfile: () => {
        const currentProfile = get().profile;
        if (currentProfile && !currentProfile.isLegacyUser) {
          // If there's an existing profile without the legacy flag, mark as legacy
          set({
            profile: {
              ...currentProfile,
              isLegacyUser: true,
              licenseKey: "LEGACY_ACCESS",
              licenseStatus: 'legacy'
            }
          });
        } else if (currentProfile && !currentProfile.licenseStatus) {
          // Set status for existing profiles
          set({
            profile: {
              ...currentProfile,
              licenseStatus: currentProfile.isLegacyUser ? 'legacy' : 
                           currentProfile.licenseKey ? 'active' : 'inactive'
            }
          });
        }
      },
    }),
    {
      name: "user-profile",
      onRehydrateStorage: () => (state) => {
        // Call initializeProfile after storage is rehydrated
        state?.initializeProfile();
      },
    }
  )
)
