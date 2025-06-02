import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  appInitializationService,
  InitializationStatus,
} from "../services/appInitializationService";

export interface StepSession {
  id: string;
  startTime: number;
  endTime?: number;
  coordinates: { lat: number; lon: number; timestamp: number }[];
  steps: number;
  sessionStartSteps?: number; // Baseline steps at session start
  sessionStartCalories?: number; // Baseline calories at session start
  distance?: number;
  calories?: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  dailyStepGoal: number;
  onboardingComplete: boolean;
}

export type ChartMode = "day" | "week" | "month" | "year";

interface StepStore {
  sessions: StepSession[];
  userProfile: UserProfile;
  chartMode: ChartMode;
  activeSession: StepSession | null;
  selectedRange: { from: string | Date; to: string | Date };
  isTracking: boolean;

  // App initialization state
  initializationStatus: InitializationStatus | null;
  isAppReady: boolean;
  // Session actions
  addSession: (session: StepSession) => void;
  updateActiveSession: (data: Partial<StepSession>) => void;
  getSessionById: (id: string) => StepSession | undefined;
  deleteSession: (id: string) => void;
  startTracking: () => void;
  stopTracking: () => void;

  // User profile actions
  updateUserProfile: (data: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  // Chart actions
  setChartMode: (mode: ChartMode) => void;
  setDateRange: (from: Date, to: Date) => void;

  // App initialization actions
  initializeApp: () => Promise<void>;
  setInitializationStatus: (status: InitializationStatus) => void;
}

const defaultUserProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  age: 0,
  dailyStepGoal: 10000,
  onboardingComplete: false,
};

export const useStepStore = create<StepStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      userProfile: defaultUserProfile,
      chartMode: "day",
      activeSession: null,
      isTracking: false,
      selectedRange: {
        from: new Date(),
        to: new Date(),
      },

      // App initialization state
      initializationStatus: null,
      isAppReady: false,

      // Session actions
      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSession: null,
          isTracking: false,
        }));
      },
      updateActiveSession: (data) => {
        set((state) => {
          if (!state.activeSession) {
            // Warning: Trying to update non-existent active session
            return state;
          }
          const updatedSession = { ...state.activeSession, ...data };
          // Coordinate updates handled here if needed
          return {
            activeSession: updatedSession,
          };
        });
      },
      getSessionById: (id) => {
        return get().sessions.find((session) => session.id === id);
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },
      startTracking: () => {
        const newSession: StepSession = {
          id: Date.now().toString(),
          startTime: Date.now(),
          coordinates: [],
          steps: 0,
        };
        set(() => ({
          activeSession: newSession,
          isTracking: true,
        }));
      },
      stopTracking: () => {
        const activeSession = get().activeSession;
        if (activeSession) {
          // Calculate distance from coordinates
          const calculateDistance = (
            lat1: number,
            lon1: number,
            lat2: number,
            lon2: number
          ): number => {
            const R = 6371; // Earth's radius in kilometers
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };
          const calculateTotalDistance = (
            coordinates: { lat: number; lon: number; timestamp: number }[]
          ): number => {
            if (!coordinates || coordinates.length < 2) return 0;
            let totalDistance = 0;
            for (let i = 1; i < coordinates.length; i++) {
              const prev = coordinates[i - 1];
              const curr = coordinates[i];
              totalDistance += calculateDistance(
                prev.lat,
                prev.lon,
                curr.lat,
                curr.lon
              );
            }
            return totalDistance;
          };
          const calculatedDistance = calculateTotalDistance(
            activeSession.coordinates || []
          );
          const completedSession: StepSession = {
            ...activeSession,
            endTime: Date.now(),
            distance: calculatedDistance,
          };
          set((state) => ({
            sessions: [...state.sessions, completedSession],
            activeSession: null,
            isTracking: false,
          }));
        }
      },

      // User profile actions
      updateUserProfile: (data) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...data },
        }));
      },

      completeOnboarding: () => {
        set((state) => ({
          userProfile: { ...state.userProfile, onboardingComplete: true },
        }));
      },

      // Chart actions
      setChartMode: (mode) => {
        set(() => ({ chartMode: mode }));
      },
      setDateRange: (from, to) => {
        set(() => ({
          selectedRange: { from, to },
        }));
      },

      // App initialization actions
      initializeApp: async () => {
        try {
          const status = await appInitializationService.initialize();
          set(() => ({
            initializationStatus: status,
            isAppReady: status.isInitialized,
          }));
        } catch (error) {
          // App initialization failed
          set(() => ({
            initializationStatus: {
              isInitialized: false,
              hasPermissions: false,
              isTrackingActive: false,
              error: "Initialization failed",
            },
            isAppReady: false,
          }));
        }
      },

      setInitializationStatus: (status) => {
        set(() => ({
          initializationStatus: status,
          isAppReady: status.isInitialized,
        }));
      },
    }),
    {
      name: "step-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStepStore;
