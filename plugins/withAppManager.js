const {
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const KOTLIN_SOURCE = `package com.virtualdroid.appmanager

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
                if (isSystem) continue
                val obj = JSONObject()
                obj.put("packageName", pkg.packageName)
                obj.put("appName", pm.getApplicationLabel(pkg).toString())
                obj.put("isSystemApp", false)
                try {
                    val pInfo = pm.getPackageInfo(pkg.packageName, 0)
                    obj.put("versionName", pInfo.versionName ?: "?")
                } catch (e: Exception) { obj.put("versionName", "?") }
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
}`;

const PACKAGE_SOURCE = `package com.virtualdroid.appmanager

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AppManagerPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(AppManagerModule(ctx))
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}`;

const withAppManager = (config) => {
  // Step 1: Copy Kotlin files into android/app/src
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const destDir = path.join(
        projectRoot,
        'android/app/src/main/java/com/virtualdroid/appmanager'
      );
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, 'AppManagerModule.kt'), KOTLIN_SOURCE);
      fs.writeFileSync(path.join(destDir, 'AppManagerPackage.kt'), PACKAGE_SOURCE);
      return cfg;
    },
  ]);

  // Step 2: Register in MainApplication
  config = withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('AppManagerPackage')) return cfg;

    // Add import after last import line
    src = src.replace(
      /(import expo\.modules\.)/,
      `import com.virtualdroid.appmanager.AppManagerPackage\n$1`
    );

    // Add to getPackages — Kotlin style
    src = src.replace(
      /return packages/,
      `packages.add(AppManagerPackage())\n      return packages`
    );

    cfg.modResults.contents = src;
    return cfg;
  });

  return config;
};

module.exports = withAppManager;
