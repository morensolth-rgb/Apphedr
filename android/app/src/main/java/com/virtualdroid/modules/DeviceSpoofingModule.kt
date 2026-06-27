package com.virtualdroid.modules

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import android.os.Build
import java.io.File

@ReactModule(name = DeviceSpoofingModule.NAME)
class DeviceSpoofingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "DeviceSpoofingModule"
    }

    override fun getName() = NAME

    /**
     * Apply a full device profile to a virtual instance via root.
     * Uses resetprop (Magisk) to change system properties.
     */
    @ReactMethod
    fun applyProfile(instanceId: String, profile: ReadableMap, promise: Promise) {
        try {
            val androidId   = profile.getString("androidId") ?: return promise.reject("ERR", "Missing androidId")
            val imei        = profile.getString("imei") ?: ""
            val model       = profile.getString("deviceModel") ?: ""
            val manufacturer= profile.getString("manufacturer") ?: ""
            val fingerprint = profile.getString("buildFingerprint") ?: ""
            val serial      = profile.getString("serialNumber") ?: ""

            // Use resetprop (Magisk) to spoof system props inside virtual space
            execRoot("resetprop ro.product.model \"$model\"")
            execRoot("resetprop ro.product.manufacturer \"$manufacturer\"")
            execRoot("resetprop ro.build.fingerprint \"$fingerprint\"")
            execRoot("resetprop ro.serialno \"$serial\"")

            // Android ID is stored in settings DB per-instance
            execRoot("settings put secure android_id $androidId")

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SPOOF_ERROR", e.message, e)
        }
    }

    /**
     * Enable or disable fake root simulation inside a virtual instance.
     */
    @ReactMethod
    fun setFakeRoot(instanceId: String, enabled: Boolean, promise: Promise) {
        try {
            // Write fake su binary into instance's private dir
            val instanceDir = reactApplicationContext.filesDir.resolve("instances/$instanceId")
            instanceDir.mkdirs()
            val fakeSu = File(instanceDir, "su")
            if (enabled) {
                fakeSu.writeText("#!/system/bin/sh\nexec \"\$@\"\n")
                fakeSu.setExecutable(true)
                execRoot("mount --bind ${fakeSu.absolutePath} /system/xbin/su")
            } else {
                execRoot("umount /system/xbin/su")
                fakeSu.delete()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ROOT_ERROR", e.message, e)
        }
    }

    /**
     * Reset all spoofing to real device values.
     */
    @ReactMethod
    fun resetProfile(instanceId: String, promise: Promise) {
        try {
            execRoot("resetprop ro.product.model \"${Build.MODEL}\"")
            execRoot("resetprop ro.product.manufacturer \"${Build.MANUFACTURER}\"")
            execRoot("resetprop ro.build.fingerprint \"${Build.FINGERPRINT}\"")
            execRoot("resetprop ro.serialno \"${Build.SERIAL}\"")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RESET_ERROR", e.message, e)
        }
    }

    private fun execRoot(cmd: String) {
        val process = Runtime.getRuntime().exec(arrayOf("su", "-c", cmd))
        process.waitFor()
    }
}
