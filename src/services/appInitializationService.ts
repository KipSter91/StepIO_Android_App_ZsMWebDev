// AppInitializationService: Handles app startup initialization
import { nativeStepCounterService } from "./nativeStepCounterService";
import { requestAllPermissions } from "../utils/permissions";

export interface InitializationStatus {
  isInitialized: boolean;
  hasPermissions: boolean;
  isTrackingActive: boolean;
  error?: string;
}

class AppInitializationService {
  private isInitializing = false;
  private initializationPromise: Promise<InitializationStatus> | null = null;

  // Main initialization method - ensures it only runs once
  public async initialize(): Promise<InitializationStatus> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If currently initializing synchronously, wait briefly and retry
    if (this.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initialize();
    }

    this.isInitializing = true;

    this.initializationPromise = this.performInitialization();

    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.isInitializing = false;
    }
  }

  private async performInitialization(): Promise<InitializationStatus> {
    try {
      // Removed all debug and console logs for production readiness

      // Step 1: Check if pedometer is available
      if (!nativeStepCounterService.isPedometerAvailable()) {
        return {
          isInitialized: false,
          hasPermissions: false,
          isTrackingActive: false,
          error: "Step counter not available on this device",
        };
      }

      // Step 2: Request necessary permissions
      const hasPermissions = await requestAllPermissions(true); // minimal = true for less intrusive startup

      if (!hasPermissions) {
        return {
          isInitialized: true,
          hasPermissions: false,
          isTrackingActive: false,
          error: "Required permissions not granted",
        };
      }

      // Step 3: Check current tracking status
      const isTrackingActive =
        await nativeStepCounterService.isTrackingActive();

      // Step 4: Start tracking if not already active and permissions are granted
      let finalTrackingStatus = isTrackingActive;
      if (!isTrackingActive && hasPermissions) {
        const startResult = await nativeStepCounterService.startTracking();
        finalTrackingStatus = startResult;
      }

      return {
        isInitialized: true,
        hasPermissions,
        isTrackingActive: finalTrackingStatus,
      };
    } catch (error) {
      return {
        isInitialized: false,
        hasPermissions: false,
        isTrackingActive: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown initialization error",
      };
    }
  }

  // Reset initialization state (useful for testing or manual re-initialization)
  public reset(): void {
    this.isInitializing = false;
    this.initializationPromise = null;
  }

  // Quick status check without full initialization
  public async getQuickStatus(): Promise<Partial<InitializationStatus>> {
    try {
      const isTrackingActive =
        await nativeStepCounterService.isTrackingActive();
      return {
        isTrackingActive,
        hasPermissions: true, // Assume true if tracking is active
      };
    } catch {
      return {
        isTrackingActive: false,
        hasPermissions: false,
      };
    }
  }
}

export const appInitializationService = new AppInitializationService();
