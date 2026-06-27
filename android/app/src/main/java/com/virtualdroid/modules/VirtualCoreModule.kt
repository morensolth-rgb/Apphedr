package com.virtualdroid.modules

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.virtualdroid.virtualcore.VirtualEngine
import java.io.File

@ReactModule(name = VirtualCoreModule.NAME)
class VirtualCoreModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "VirtualCoreModule"
    }

    private val engine = VirtualEngine.getInstance(reactContext)

    override fun getName() = NAME

    /**
     * Initialize the virtual engine.
     * Must be called once at app startup.
     */
    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            engine.initialize()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message, e)
        }
    }

    /**
     * Start a virtual instance.
     */
    @ReactMethod
    fun startInstance(instanceId: String, promise: Promise) {
        try {
            engine.startInstance(instanceId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message, e)
        }
    }

    /**
     * Stop a virtual instance.
     */
    @ReactMethod
    fun stopInstance(instanceId: String, promise: Promise) {
        try {
            engine.stopInstance(instanceId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    /**
     * Install APK into virtual instance.
     */
    @ReactMethod
    fun installApp(instanceId: String, apkPath: String, promise: Promise) {
        try {
            val result = engine.installApp(instanceId, apkPath)
            val map = Arguments.createMap().apply {
                putBoolean("success", result.success)
                putString("packageName", result.packageName)
                putString("appName", result.appName)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("INSTALL_ERROR", e.message, e)
        }
    }

    /**
     * Uninstall app from virtual instance.
     */
    @ReactMethod
    fun uninstallApp(instanceId: String, packageName: String, promise: Promise) {
        try {
            engine.uninstallApp(instanceId, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UNINSTALL_ERROR", e.message, e)
        }
    }

    /**
     * Launch app inside virtual instance.
     */
    @ReactMethod
    fun launchApp(instanceId: String, packageName: String, promise: Promise) {
        try {
            engine.launchApp(instanceId, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", e.message, e)
        }
    }

    /**
     * Get instance running status.
     */
    @ReactMethod
    fun getInstanceStatus(instanceId: String, promise: Promise) {
        try {
            val status = engine.getInstanceStatus(instanceId)
            promise.resolve(status)
        } catch (e: Exception) {
            promise.resolve("error")
        }
    }
}
