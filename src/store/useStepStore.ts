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
  selectedRange: { from: Date; to: Date };
  isTracking: boolean;

  // App initialization state
  initializationStatus: InitializationStatus | null;
  isAppReady: boolean;

  // Session actions
  addSession: (session: StepSession) => void;
  updateActiveSession: (data: Partial<StepSession>) => void;
  getSessionById: (id: string) => StepSession | undefined;
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
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, ...data }
            : null,
        }));
      },

      getSessionById: (id) => {
        return get().sessions.find((session) => session.id === id);
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
          const completedSession: StepSession = {
            ...activeSession,
            endTime: Date.now(),
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
          console.error("[Store] App initialization failed:", error);
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
