package com.kipster91.stepio.stepcounter

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.*
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileWriter
import java.lang.ref.WeakReference
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.Executors
import com.kipster91.stepio.R

class StepCounterService : Service(), SensorEventListener {
    data class StepTimestamp(
        val timestamp: Long,
        val steps: Int,
        val cumulativeSteps: Int
    )
    
    private lateinit var sensorManager: SensorManager
    private var stepSensor: Sensor? = null
    private var isTracking = false
    private var initialSteps: Float = 0f
    private var previousTotalSteps: Float = 0f
    private var todaySteps: Int = 0
    private var sharedPreferences: SharedPreferences? = null
    private val SAVE_INTERVAL = 3 * 1000
    private var lastSaveTime: Long = 0
    private var pendingStepsToSave: Int = 0
    private var eventsSinceLastBroadcast: Int = 0
    private val BROADCAST_THRESHOLD = 10
    
    // Use weak reference to prevent memory leaks
    private var notificationManagerRef: WeakReference<NotificationManager>? = null
    private var notificationBuilder: NotificationCompat.Builder? = null
    private var customNotificationView: RemoteViews? = null
    
    // Use separate handler for notification updates to reduce main thread load
    private var updateNotificationHandler: Handler? = null
    private val UPDATE_NOTIFICATION_INTERVAL = 3000L // Reduce update frequency to 3 seconds
    
    // Separate handler for main thread operations
    private val handler = Handler(Looper.getMainLooper())
    
    // Background thread for file I/O operations
    private val ioExecutor = Executors.newSingleThreadExecutor()    
    companion object {
        private const val TAG = "StepCounterService"
        private const val NOTIFICATION_ID = 9999
        private const val CHANNEL_ID = "com.kipster91.stepio.STEP_COUNTER_CHANNEL"

        private const val ACTION_STOP = "com.kipster91.stepio.ACTION_STOP"

        private const val UPDATE_NOTIFICATION_TASK = 1001

        const val ACTION_STEP_UPDATE = "com.kipster91.stepio.ACTION_STEP_UPDATE"
        const val ACTION_TRACKING_STATUS = "com.kipster91.stepio.ACTION_TRACKING_STATUS"

        private const val LAST_ACTIVE_DATE_KEY = "last_active_date"

        @Volatile
        private var instance: WeakReference<StepCounterService>? = null

        fun getInstance(): StepCounterService? {
            return instance?.get()
        }
    }
    
    override fun onCreate() {
        super.onCreate()

        instance = WeakReference(this)
        
        sharedPreferences = getSharedPreferences(StepCounterModule.PREFERENCES_NAME, Context.MODE_PRIVATE)
        todaySteps = sharedPreferences?.getInt(StepCounterModule.STEPS_STORAGE_KEY, 0) ?: 0
        pendingStepsToSave = 0
        eventsSinceLastBroadcast = 0

        checkAndResetStepsForNewDay()

        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

        if (stepSensor == null) {
            // Try to use step detector as fallback
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
        }

        createNotificationChannel()
        
        // Initialize update handler for notification on a background thread
        val handlerThread = HandlerThread("NotificationUpdateThread")
        handlerThread.start()
        updateNotificationHandler = Handler(handlerThread.looper) { msg ->
            when (msg.what) {
                UPDATE_NOTIFICATION_TASK -> {
                    // Only update notification if tracking is still active
                    if (isTracking) {
                        updateNotification()
                        updateNotificationHandler?.sendEmptyMessageDelayed(UPDATE_NOTIFICATION_TASK, UPDATE_NOTIFICATION_INTERVAL)
                    }
                    true
                }
                else -> false
            }
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        checkAndResetStepsForNewDay()

        when (intent?.action) {
            StepCounterModule.ACTION_START_TRACKING -> startTracking()
        }

        return START_STICKY
    }
      private fun checkAndResetStepsForNewDay() {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = dateFormat.format(Date())
        val lastDate = sharedPreferences?.getString(LAST_ACTIVE_DATE_KEY, null)
        
        if (lastDate == null || lastDate != today) {
            todaySteps = 0
            pendingStepsToSave = 0
            eventsSinceLastBroadcast = 0
            
            sharedPreferences?.edit()?.apply {
                putString(LAST_ACTIVE_DATE_KEY, today)
                putInt(StepCounterModule.STEPS_STORAGE_KEY, 0)
                apply()
            }
            
            if (isTracking) {
                updateNotificationLayout()
            }
        }
    }

    private fun startTracking() {
        if (stepSensor == null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
            if (stepSensor == null) {
                stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
                if (stepSensor == null) {
                    return
                }
            }
        }

        lastSaveTime = System.currentTimeMillis()

        sharedPreferences?.edit()?.apply {
            putBoolean(StepCounterModule.TRACKING_STATUS_KEY, true)
            apply()
        }
        
        val registrationSuccess = sensorManager.registerListener(
            this,
            stepSensor,
            SensorManager.SENSOR_DELAY_NORMAL
        )
        
        if (!registrationSuccess) {
            return
        }

        // Start as foreground service with FOREGROUND_SERVICE_TYPE_HEALTH
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, createNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
        } else {
            startForeground(NOTIFICATION_ID, createNotification())
        }
        updateNotificationHandler?.sendEmptyMessage(UPDATE_NOTIFICATION_TASK)

        isTracking = true
        broadcastTrackingStatus(true)
        
        // Schedule periodic full notification rebuilds to prevent custom view loss - less frequently
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (isTracking) {
                    // Completely rebuild notification instead of just updating
                    val notification = createNotification() 
                    notificationManagerRef?.get()?.notify(NOTIFICATION_ID, notification)
                    handler.postDelayed(this, 30 * 60 * 1000) // Every 30 minutes instead of 15
                }
            }
        }, 30 * 60 * 1000)
    }

    override fun onSensorChanged(event: SensorEvent) {
        val currentTime = System.currentTimeMillis()
        val endOfDay = Calendar.getInstance().apply {
            timeInMillis = currentTime
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis

        if (currentTime > endOfDay) return

        checkAndResetStepsForNewDay()

        if (event.sensor.type == Sensor.TYPE_STEP_COUNTER) {
            val steps = event.values[0]
            if (initialSteps == 0f) {
                initialSteps = steps
                previousTotalSteps = steps
            }
            
            val stepsSinceLastReading = steps - previousTotalSteps
            previousTotalSteps = steps

            if (stepsSinceLastReading <= 0) return
            
            val stepsToAdd = stepsSinceLastReading.toInt()
            todaySteps += stepsToAdd
            pendingStepsToSave += stepsToAdd
            eventsSinceLastBroadcast += stepsToAdd

            if (currentTime - lastSaveTime > SAVE_INTERVAL) {
                // Only save if we have steps to save
                if (pendingStepsToSave > 0) {
                    val stepTimestamp = StepTimestamp(
                        timestamp = currentTime,
                        steps = pendingStepsToSave,
                        cumulativeSteps = todaySteps
                    )
                    saveStepTimestamps(stepTimestamp)
                    lastSaveTime = currentTime
                    pendingStepsToSave = 0
                    
                    // Always broadcast on save
                    broadcastStepUpdate(todaySteps)
                    eventsSinceLastBroadcast = 0
                }
            }

            // Only broadcast steps if threshold reached to reduce overhead
            if (eventsSinceLastBroadcast >= BROADCAST_THRESHOLD) {
                broadcastStepUpdate(todaySteps)
                eventsSinceLastBroadcast = 0
            }

            sharedPreferences?.edit()?.apply {
                putInt(StepCounterModule.STEPS_STORAGE_KEY, todaySteps)
                apply()
            }
        } else if (event.sensor.type == Sensor.TYPE_STEP_DETECTOR) {
            todaySteps += 1
            pendingStepsToSave += 1
            eventsSinceLastBroadcast += 1

            if (currentTime - lastSaveTime > SAVE_INTERVAL) {
                // Only save if we have steps to save
                if (pendingStepsToSave > 0) {
                    val stepTimestamp = StepTimestamp(
                        timestamp = currentTime,
                        steps = pendingStepsToSave,
                        cumulativeSteps = todaySteps
                    )
                    saveStepTimestamps(stepTimestamp)
                    lastSaveTime = currentTime
                    pendingStepsToSave = 0
                    
                    // Always broadcast on save
                    broadcastStepUpdate(todaySteps)
                    eventsSinceLastBroadcast = 0
                }
            }

            // Only broadcast if threshold reached
            if (eventsSinceLastBroadcast >= BROADCAST_THRESHOLD) {
                broadcastStepUpdate(todaySteps)
                eventsSinceLastBroadcast = 0
            }

            sharedPreferences?.edit()?.apply {
                putInt(StepCounterModule.STEPS_STORAGE_KEY, todaySteps)
                apply()
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        // Not used
    }

    // Methods for step timestamps - optimized to write on background thread
    private fun saveStepTimestamps(newStepTimestamp: StepTimestamp? = null) {
        // Run on background thread to avoid blocking main thread
        ioExecutor.execute {
            try {
                val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val fileName = "step_timestamps_$currentDate.json"
                val file = File(applicationContext.filesDir, fileName)
                
                // Read existing data (if exists)
                val existingJsonArray = if (file.exists()) {
                    val jsonString = file.readText()
                    JSONArray(jsonString)
                } else {
                    JSONArray()
                }
                
                // Add the new timestamp if provided
                if (newStepTimestamp != null) {
                    val jsonObject = JSONObject()
                    jsonObject.put("timestamp", newStepTimestamp.timestamp)
                    jsonObject.put("steps", newStepTimestamp.steps)
                    jsonObject.put("cumulativeSteps", newStepTimestamp.cumulativeSteps)
                    existingJsonArray.put(jsonObject)
                }
                
                // Write the updated JSON array
                FileWriter(file).use { it.write(existingJsonArray.toString()) }
                
            } catch (e: Exception) {
                // Log error
            }
        }
    }
    
    // Methods to get step data - also with background thread
    fun getStepTimestampsForDate(date: String, callback: (List<StepTimestamp>) -> Unit) {
        ioExecutor.execute {
            val timestamps = getStepTimestampsForDateSync(date)
            // Send result back to main thread
            handler.post {
                callback(timestamps)
            }
        }
    }
    
    // Synchronous version for direct calls
    fun getStepTimestampsForDateSync(date: String): List<StepTimestamp> {
        try {
            val fileName = "step_timestamps_$date.json"
            val file = File(applicationContext.filesDir, fileName)
            
            if (file.exists()) {
                val jsonString = file.readText()
                val jsonArray = JSONArray(jsonString)
                val timestamps = mutableListOf<StepTimestamp>()
                
                for (i in 0 until jsonArray.length()) {
                    val jsonObject = jsonArray.getJSONObject(i)
                    timestamps.add(StepTimestamp(
                        timestamp = jsonObject.getLong("timestamp"),
                        steps = jsonObject.getInt("steps"),
                        cumulativeSteps = jsonObject.getInt("cumulativeSteps")
                    ))
                }
                
                return timestamps
            }
        } catch (e: Exception) {
            // Log error
        }
        
        return emptyList()
    }
    
    // Public getters for use from module
    fun getTodaySteps(): Int {
        return todaySteps
    }
    
    fun isTrackingActive(): Boolean {
        return isTracking
    }
    
    // Calculate calories burned based on step count
    // Average calorie burn is about 0.04 calories per step
    private fun calculateCaloriesBurned(steps: Int): Float {
        val caloriesPerStep = 0.04f
        return steps * caloriesPerStep
    }
    
    // Get today's total calories burned
    fun getTodayCalories(): Float {
        return calculateCaloriesBurned(todaySteps)
    }
    
    // Create notification channel for Android O+
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "StepIO Step Counter"
            val descriptionText = "Shows the current step count and controls"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250, 150, 400)
                setShowBadge(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            notificationManagerRef = WeakReference(notificationManager)
        } else {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManagerRef = WeakReference(notificationManager)
        }
    }
    
    // Create notification for foreground service
    private fun createNotification(): Notification {
        // Create custom RemoteViews for notification
        customNotificationView = RemoteViews(packageName, resources.getIdentifier(
            "step_counter_notification", "layout", packageName
        ))
          // Get app main activity's intent - módosítva a clean start biztosításához
        val packageManager = applicationContext.packageManager
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        // Biztosítjuk, hogy új feladatként indul, ne halmozódjon
        launchIntent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
          // Get the notification color from resources
        val notificationColor = resources.getColor(resources.getIdentifier(
            "step_counter_notification_color", "color", packageName
        ), null)
        
        // Build the notification
        notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle("StepIO Active")
            .setContentText("Tracking your steps")
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setOnlyAlertOnce(true)
            .setCustomContentView(customNotificationView)
            .setCustomBigContentView(customNotificationView)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(notificationColor)
        
        updateNotificationLayout()
        
        return notificationBuilder!!.build()
    }
    
    // Update notification with latest step count
    private fun updateNotification() {
        if (!isTracking) return
        
        updateNotificationLayout()
        notificationManagerRef?.get()?.notify(NOTIFICATION_ID, notificationBuilder?.build() ?: return)
    }
    
    // Update the custom notification layout
    private fun updateNotificationLayout() {
        // Make sure we have the custom view
        if (customNotificationView == null) return
        
        // Update step count
        customNotificationView?.setTextViewText(
            resources.getIdentifier("notification_steps", "id", packageName),
            "$todaySteps steps"
        )
        
        // Update calorie count
        val calories = getTodayCalories()
        val caloriesFormatted = String.format("%.1f kCal", calories)
        customNotificationView?.setTextViewText(
            resources.getIdentifier("notification_calories", "id", packageName),
            caloriesFormatted
        )
    }
    
    // Broadcast step update to JS layer
    private fun broadcastStepUpdate(steps: Int) {
        val intent = Intent(ACTION_STEP_UPDATE)
        intent.putExtra("steps", steps)
        intent.putExtra("calories", calculateCaloriesBurned(steps))
        intent.putExtra("timestamp", System.currentTimeMillis())
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }
    
    // Broadcast tracking status to JS layer
    private fun broadcastTrackingStatus(isTracking: Boolean) {
        val intent = Intent(ACTION_TRACKING_STATUS)
        intent.putExtra("tracking", isTracking)
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }
    
    override fun onBind(intent: Intent): IBinder? {
        return null
    }
    
    override fun onDestroy() {
        // Save any pending steps before destroying
        if (pendingStepsToSave > 0) {
            val stepTimestamp = StepTimestamp(
                timestamp = System.currentTimeMillis(),
                steps = pendingStepsToSave,
                cumulativeSteps = todaySteps
            )
            saveStepTimestamps(stepTimestamp)
            pendingStepsToSave = 0
        }
        // Ensure we unregister sensor listeners to avoid leaks
        sensorManager.unregisterListener(this)
        
        // Remove all pending notification updates
        updateNotificationHandler?.removeCallbacksAndMessages(null)
        handler.removeCallbacksAndMessages(null)
        
        // Shutdown our executor
        ioExecutor.shutdown()
        
        // Clear singleton instance
        instance = null
        
        super.onDestroy()
    }
}