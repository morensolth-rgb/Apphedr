package com.virtualdroid.appmanager

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class AppManagerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppManagerModule"

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val array = JSONArray()

            for (pkg in packages) {
                val isSystem = (pkg.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                // Only user apps by default
                if (isSystem) continue

                val obj = JSONObject()
                obj.put("packageName", pkg.packageName)
                obj.put("appName", pm.getApplicationLabel(pkg).toString())
                obj.put("isSystemApp", false)
                try {
                    val pInfo = pm.getPackageInfo(pkg.packageName, 0)
                    obj.put("versionName", pInfo.versionName ?: "?")
                } catch (e: Exception) {
                    obj.put("versionName", "?")
                }
                array.put(obj)
            }

            promise.resolve(array.toString())
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getApkPath(packageName: String, promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            promise.resolve(appInfo.sourceDir)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }
}
