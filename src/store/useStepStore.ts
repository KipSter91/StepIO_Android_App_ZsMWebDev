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
            console.log(
              "[Store] Warning: Trying to update non-existent active session"
            );
            return state;
          }

          const updatedSession = { ...state.activeSession, ...data };

          // Log coordinate updates
          if (data.coordinates) {
            console.log(
              "[Store] Updated session coordinates. Total count:",
              data.coordinates.length
            );
            if (data.coordinates.length > 0) {
              const lastCoord = data.coordinates[data.coordinates.length - 1];
              console.log("[Store] Latest coordinate:", lastCoord);
            }
          }

          return {
            activeSession: updatedSession,
          };
        });
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

        console.log("[Store] Starting new tracking session:");
        console.log("- Session ID:", newSession.id);
        console.log(
          "- Start Time:",
          new Date(newSession.startTime).toISOString()
        );

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

          console.log("[Store] Session completed and saved:");
          console.log("- Session ID:", completedSession.id);
          console.log(
            "- Start Time:",
            new Date(completedSession.startTime).toISOString()
          );
          console.log(
            "- End Time:",
            new Date(completedSession.endTime!).toISOString()
          );
          console.log(
            "- Duration:",
            (
              (completedSession.endTime! - completedSession.startTime) /
              1000
            ).toFixed(2),
            "seconds"
          );
          console.log("- Steps:", completedSession.steps);
          console.log("- Distance:", calculatedDistance.toFixed(3), "km");
          console.log(
            "- Coordinates collected:",
            completedSession.coordinates?.length || 0
          );

          if (
            completedSession.coordinates &&
            completedSession.coordinates.length > 0
          ) {
            console.log("- First coordinate:", completedSession.coordinates[0]);
            console.log(
              "- Last coordinate:",
              completedSession.coordinates[
                completedSession.coordinates.length - 1
              ]
            );
          }

          set((state) => ({
            sessions: [...state.sessions, completedSession],
            activeSession: null,
            isTracking: false,
          }));

          console.log("[Store] Total sessions saved:", get().sessions.length);
        } else {
          console.log("[Store] No active session to stop");
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
        console.log("🏪 Store setDateRange called with:");
        console.log("🏪 From:", from);
        console.log(
          "🏪 From ISO:",
          from instanceof Date ? from.toISOString() : "Not a Date"
        );
        console.log("🏪 To:", to);
        console.log(
          "🏪 To ISO:",
          to instanceof Date ? to.toISOString() : "Not a Date"
        );

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
