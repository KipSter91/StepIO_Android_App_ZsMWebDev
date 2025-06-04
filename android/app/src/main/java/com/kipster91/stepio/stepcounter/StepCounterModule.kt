package com.kipster91.stepio.stepcounter

import android.content.Intent
import android.content.SharedPreferences
import android.content.Context
import android.content.BroadcastReceiver
import android.content.IntentFilter
import android.util.Log
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference
import java.lang.Thread
import java.util.concurrent.Executor
import java.util.concurrent.Executors

class StepCounterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val context: ReactApplicationContext = reactContext
    private val TAG = "StepCounterModule"
    private val sharedPreferences: SharedPreferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
    
    // BroadcastReceivers for step updates and tracking status
    private val stepUpdateReceiver: BroadcastReceiver
    private val trackingStatusReceiver: BroadcastReceiver
    
    // Background thread for file operations
    private val ioExecutor: Executor = Executors.newSingleThreadExecutor()
    
    init {
        // Initialize receivers
        stepUpdateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val steps = intent.getIntExtra("steps", 0)
                val calories = intent.getFloatExtra("calories", 0f)
                val timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis())
                
                // Send to React Native
                sendStepUpdateEvent(steps, calories, timestamp)
            }
        }
        
        trackingStatusReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val isTracking = intent.getBooleanExtra("tracking", false)
                
                // Send to React Native
                sendTrackingStatusEvent(isTracking)
            }
        }
        
        // Register receivers
        LocalBroadcastManager.getInstance(context).registerReceiver(
            stepUpdateReceiver,
            IntentFilter(StepCounterService.ACTION_STEP_UPDATE)
        )
        
        LocalBroadcastManager.getInstance(context).registerReceiver(
            trackingStatusReceiver,
            IntentFilter(StepCounterService.ACTION_TRACKING_STATUS)
        )
    }
    
    companion object {
        const val NAME = "NativeStepCounter"
        
        // Constants for SharedPreferences
        const val PREFERENCES_NAME = "StepIOPreferences"
        const val STEPS_STORAGE_KEY = "dailySteps"
        const val TRACKING_STATUS_KEY = "trackingActive"
        
        // Constants for events
        const val STEP_UPDATE_EVENT = "StepUpdateEvent"
        const val TRACKING_STATUS_EVENT = "TrackingStatusEvent"
        
        // Constants for actions
        const val ACTION_START_TRACKING = "com.kipster91.stepio.ACTION_START_TRACKING"
    }
    
    override fun getName(): String {
        return NAME
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        
        // Unregister receivers when the module is destroyed
        try {
            LocalBroadcastManager.getInstance(reactApplicationContext).unregisterReceiver(stepUpdateReceiver)
            LocalBroadcastManager.getInstance(reactApplicationContext).unregisterReceiver(trackingStatusReceiver)
        } catch (e: Exception) {
            // Log error but don't crash
        }
    }
    
    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            val intent = Intent(context, StepCounterService::class.java)
            intent.action = ACTION_START_TRACKING
            
            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_STARTING_TRACKING", e.message, e)
        }
    }
    
    @ReactMethod
    fun isTrackingActive(promise: Promise) {
        try {
            val service = StepCounterService.getInstance()
            
            if (service != null) {
                promise.resolve(service.isTrackingActive())
            } else {
                // If service is not running, check shared preferences
                val isTracking = sharedPreferences.getBoolean(TRACKING_STATUS_KEY, false)
                promise.resolve(isTracking)
            }
        } catch (e: Exception) {
            promise.reject("ERROR_CHECKING_TRACKING", e.message, e)
        }
    }
    
    @ReactMethod
    fun getTodaySteps(promise: Promise) {
        try {
            val service = StepCounterService.getInstance()
            
            if (service != null) {
                promise.resolve(service.getTodaySteps())
            } else {
                // If service is not running, get from shared preferences
                val todaySteps = sharedPreferences.getInt(STEPS_STORAGE_KEY, 0)
                promise.resolve(todaySteps)
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_STEPS", e.message, e)
        }
    }
    
    @ReactMethod
    fun getStepTimestampsForDate(date: String, promise: Promise) {
        try {
            val service = StepCounterService.getInstance()
            
            if (service != null) {
                // Use the async version with callback
                service.getStepTimestampsForDate(date) { timestamps ->
                    // Convert to JSON array
                    val jsonArray = WritableNativeArray()
                    
                    for (timestamp in timestamps) {
                        val entry = Arguments.createMap()
                        entry.putDouble("timestamp", timestamp.timestamp.toDouble())
                        entry.putInt("steps", timestamp.steps)
                        entry.putInt("cumulativeSteps", timestamp.cumulativeSteps)
                        jsonArray.pushMap(entry)
                    }
                    
                    promise.resolve(jsonArray)
                }
            } else {
                // Use background thread for file I/O
                ioExecutor.execute {
                    try {
                        // Try to read from file directly
                        val fileName = "step_timestamps_$date.json"
                        val file = java.io.File(context.filesDir, fileName)
                        
                        val resultJson = if (file.exists()) {
                            file.readText()
                        } else {
                            // Return empty array if no data
                            "[]"
                        }
                        
                        // Return result on main thread
                        UiThreadUtil.runOnUiThread {
                            promise.resolve(resultJson)
                        }
                    } catch (e: Exception) {
                        UiThreadUtil.runOnUiThread {
                            promise.reject("ERROR_STEP_TIMESTAMPS", e.message, e)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject("ERROR_STEP_TIMESTAMPS", e.message, e)
        }
    }
    
    @ReactMethod
    fun getTodayCalories(promise: Promise) {
        try {
            val service = StepCounterService.getInstance()
            
            if (service != null) {
                promise.resolve(service.getTodayCalories())
            } else {
                // If service is not running, calculate based on steps from shared preferences
                val todaySteps = sharedPreferences.getInt(STEPS_STORAGE_KEY, 0)
                val calories = todaySteps * 0.04f
                promise.resolve(calories)
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_CALORIES", e.message, e)
        }
    }
    
    // For React Native to listen to step updates
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN 0.65+
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN 0.65+
    }
    
    // Rate-limited event counter to prevent too many events going to JS
    private var lastEventTime = 0L
    private val MIN_EVENT_INTERVAL = 250L // ms
    
    // Send step updates to React Native
    private fun sendStepUpdateEvent(steps: Int, calories: Float, timestamp: Long) {
        try {
            val now = System.currentTimeMillis()
            // Rate limit events to JS bridge
            if (now - lastEventTime < MIN_EVENT_INTERVAL) {
                return
            }
            lastEventTime = now
            
            val params = Arguments.createMap()
            params.putInt("steps", steps)
            params.putString("timestamp", timestamp.toString())
            
            // Add calories information to the event
            params.putDouble("calories", calories.toDouble())
            
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(STEP_UPDATE_EVENT, params)
        } catch (e: Exception) {
            // Log but continue
        }
    }
    
    // Send tracking status updates to React Native
    private fun sendTrackingStatusEvent(isTracking: Boolean) {
        try {
            val params = Arguments.createMap()
            params.putBoolean("tracking", isTracking)
            
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(TRACKING_STATUS_EVENT, params)
        } catch (e: Exception) {
            // Log but continue
        }
    }
}