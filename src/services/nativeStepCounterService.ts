// NativeStepCounterService: React Native service for native step counting integration
import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  AppState,
} from "react-native";

const { NativeStepCounter } = NativeModules;
const stepCounterEmitter = new NativeEventEmitter(NativeStepCounter);

// Callback for step updates: steps, calories, timestamp
// Callback for tracking status: isActive

type StepUpdateCallback = (
  steps: number,
  calories?: number,
  timestamp?: number
) => void;
type TrackingStatusCallback = (isActive: boolean) => void;

export interface StepTimestamp {
  timestamp: number;
  steps: number;
  cumulativeSteps: number;
}

export interface HourlySteps {
  [hour: string]: number;
}

// In-memory cache for step timestamps (max 7 days, 15 min expiry)
const timestampCache: {
  [date: string]: {
    data: StepTimestamp[];
    expires: number;
  };
} = {};

const MAX_CACHE_ENTRIES = 7;

class NativeStepCounterService {
  private stepUpdateListeners: StepUpdateCallback[] = [];
  private trackingStatusListeners: TrackingStatusCallback[] = [];
  private stepEventSubscription: any = null;
  private trackingEventSubscription: any = null;
  private lastStepUpdateTime = 0;
  private lastStepsValue = 0;
  private THROTTLE_TIME = 1000; // Throttle step events to 1s

  constructor() {
    this.initialize();
  }

  // Subscribe to native events and clean up previous subscriptions
  private async initialize(): Promise<void> {
    try {
      this.cleanupSubscriptions();
      this.stepEventSubscription = stepCounterEmitter.addListener(
        "StepUpdateEvent",
        (event) => {
          const now = Date.now();
          if (now - this.lastStepUpdateTime < this.THROTTLE_TIME) return;
          const steps = typeof event === "object" ? event.steps : event;
          if (steps === this.lastStepsValue) return;
          this.lastStepsValue = steps;
          this.lastStepUpdateTime = now;
          const calories =
            typeof event === "object" ? event.calories : undefined;
          const timestamp =
            typeof event === "object"
              ? typeof event.timestamp === "string"
                ? parseInt(event.timestamp, 10)
                : event.timestamp
              : Date.now();
          this.notifyStepUpdates(steps, calories, timestamp);
        }
      );
      this.trackingEventSubscription = stepCounterEmitter.addListener(
        "TrackingStatusEvent",
        (event) => {
          const isTracking = !!event.tracking;
          this.notifyTrackingStatus(isTracking);
        }
      );
    } catch (error) {
      // Initialization failed
    }
  }

  // Remove all event subscriptions to prevent memory leaks
  private cleanupSubscriptions(): void {
    if (this.stepEventSubscription) {
      this.stepEventSubscription.remove();
      this.stepEventSubscription = null;
    }
    if (this.trackingEventSubscription) {
      this.trackingEventSubscription.remove();
      this.trackingEventSubscription = null;
    }
  }

  private notifyStepUpdates(
    steps: number,
    calories?: number,
    timestamp: number = Date.now()
  ): void {
    try {
      const listeners = [...this.stepUpdateListeners];
      listeners.forEach((callback) => {
        try {
          callback(steps, calories, timestamp);
        } catch {
          this.removeStepUpdateListener(callback);
        }
      });
    } catch {}
  }

  private notifyTrackingStatus(isActive: boolean): void {
    try {
      const listeners = [...this.trackingStatusListeners];
      listeners.forEach((callback) => {
        try {
          callback(isActive);
        } catch {
          this.removeTrackingStatusListener(callback);
        }
      });
    } catch {}
  }

  // Start native step tracking service
  public async startTracking(): Promise<boolean> {
    try {
      return await NativeStepCounter.startTracking();
    } catch {
      return false;
    }
  }

  // Query if native step tracking is active
  public async isTrackingActive(): Promise<boolean> {
    try {
      return await NativeStepCounter.isTrackingActive();
    } catch {
      return false;
    }
  }

  public async getTodaySteps(): Promise<number> {
    try {
      return await NativeStepCounter.getTodaySteps();
    } catch {
      return 0;
    }
  }

  // Convert step timestamps to hourly breakdown (0-23)
  public convertTimestampsToHourly(timestamps: StepTimestamp[]): HourlySteps {
    const hourlySteps: HourlySteps = {};
    for (let hour = 0; hour < 24; hour++) hourlySteps[hour.toString()] = 0;
    for (const timestamp of timestamps) {
      const date = new Date(timestamp.timestamp);
      const hour = date.getHours();
      hourlySteps[hour.toString()] += timestamp.steps;
    }
    return hourlySteps;
  }
  // Get hourly steps for any specific date
  public async getHourlyStepsForDate(date: Date): Promise<HourlySteps> {
    try {
      // Use local date string to avoid timezone issues
      const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      const timestamps = await this.getStepTimestampsForDate(dateString);
      return this.convertTimestampsToHourly(timestamps);
    } catch {
      const emptyData: HourlySteps = {};
      for (let hour = 0; hour < 24; hour++) emptyData[hour.toString()] = 0;
      return emptyData;
    }
  } // Get all step timestamps for a given date (YYYY-MM-DD), with cache for past days
  public async getStepTimestampsForDate(
    date: string
  ): Promise<StepTimestamp[]> {
    try {
      // Use local date to avoid timezone issues
      const today = new Date();
      const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

      // Don't return data for future dates - parse as dates for proper comparison
      const requestedDate = new Date(date + "T00:00:00");
      const todayDate = new Date(todayString + "T00:00:00");

      if (requestedDate > todayDate) {
        return [];
      }
      if (
        date !== todayString &&
        timestampCache[date] &&
        timestampCache[date].expires > Date.now()
      ) {
        return timestampCache[date].data;
      }
      const result = await NativeStepCounter.getStepTimestampsForDate(date);
      let parsedResult: StepTimestamp[];
      if (typeof result === "string") {
        try {
          parsedResult = JSON.parse(result);
        } catch {
          return [];
        }
      } else {
        parsedResult = result;
      }
      if (date !== todayString) {
        const cacheKeys = Object.keys(timestampCache);
        if (cacheKeys.length >= MAX_CACHE_ENTRIES) {
          const oldestKey = cacheKeys.sort()[0];
          delete timestampCache[oldestKey];
        }
        timestampCache[date] = {
          data: parsedResult,
          expires: Date.now() + 15 * 60 * 1000,
        };
      }
      return parsedResult;
    } catch {
      return [];
    }
  }

  // Get today's calories burned (native or fallback calculation)
  public async getTodayCalories(): Promise<number> {
    try {
      return await NativeStepCounter.getTodayCalories();
    } catch {
      const steps = await this.getTodaySteps();
      return steps * 0.04;
    }
  }

  // Register a callback for step updates
  public onStepUpdate(callback: StepUpdateCallback): void {
    if (
      typeof callback === "function" &&
      !this.stepUpdateListeners.includes(callback)
    ) {
      this.stepUpdateListeners.push(callback);
    }
  }

  // Register a callback for tracking status changes
  public onTrackingStatusChange(callback: TrackingStatusCallback): void {
    if (
      typeof callback === "function" &&
      !this.trackingStatusListeners.includes(callback)
    ) {
      this.trackingStatusListeners.push(callback);
    }
  }

  public removeStepUpdateListener(callback: StepUpdateCallback): void {
    this.stepUpdateListeners = this.stepUpdateListeners.filter(
      (listener) => listener !== callback
    );
  }

  public removeTrackingStatusListener(callback: TrackingStatusCallback): void {
    this.trackingStatusListeners = this.trackingStatusListeners.filter(
      (listener) => listener !== callback
    );
  }

  // Returns true if native step counter is available (always true on Android)
  public isPedometerAvailable(): boolean {
    return Platform.OS === "android";
  }

  // Clean up all listeners and cache
  public cleanup(): void {
    this.cleanupSubscriptions();
    this.stepUpdateListeners = [];
    this.trackingStatusListeners = [];
    this.lastStepsValue = 0;
    Object.keys(timestampCache).forEach((key) => {
      delete timestampCache[key];
    });
  }
}

export const nativeStepCounterService = new NativeStepCounterService();

// Automatically manage subscriptions on app state changes
AppState.addEventListener("change", (nextAppState) => {
  if (nextAppState === "background") {
    nativeStepCounterService["cleanupSubscriptions"]();
  } else if (nextAppState === "active") {
    nativeStepCounterService["initialize"]();
  }
});
