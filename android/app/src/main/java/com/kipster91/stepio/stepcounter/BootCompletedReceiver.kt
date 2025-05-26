package com.kipster91.stepio.stepcounter

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build

class BootCompletedReceiver : BroadcastReceiver() {
    private val TAG = "BootCompletedReceiver"
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            
            // Check if step counter was active before device shutdown
            val sharedPreferences: SharedPreferences = context.getSharedPreferences(
                StepCounterModule.PREFERENCES_NAME, Context.MODE_PRIVATE
            )
            
            val wasTrackingActive = sharedPreferences.getBoolean(StepCounterModule.TRACKING_STATUS_KEY, false)
            
            if (wasTrackingActive) {
                
                // Restart the step counter service
                val serviceIntent = Intent(context, StepCounterService::class.java)
                serviceIntent.action = StepCounterModule.ACTION_START_TRACKING
                
                try {
                    // Use startForegroundService for Android O+
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                    
                } catch (e: Exception) {
                    
                }
            } else {
                
            }
        }
    }
}