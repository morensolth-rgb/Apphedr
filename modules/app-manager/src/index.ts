import { NativeModules, Platform } from 'react-native';

const { AppManagerModule } = NativeModules;

export interface InstalledDeviceApp {
  packageName: string;
  appName: string;
  versionName: string;
  isSystemApp: boolean;
}

export const AppManager = {
  /**
   * Get list of all user-installed apps on the real device.
   */
  async getInstalledApps(): Promise<InstalledDeviceApp[]> {
    if (Platform.OS === 'android' && AppManagerModule) {
      const raw = await AppManagerModule.getInstalledApps();
      return JSON.parse(raw) as InstalledDeviceApp[];
    }
    // Fallback for dev / iOS
    return [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', versionName: '2.24.1', isSystemApp: false },
      { packageName: 'com.instagram.android', appName: 'Instagram', versionName: '300.0', isSystemApp: false },
      { packageName: 'com.facebook.katana', appName: 'Facebook', versionName: '450.0', isSystemApp: false },
      { packageName: 'com.telegram.messenger', appName: 'Telegram', versionName: '10.3', isSystemApp: false },
      { packageName: 'com.twitter.android', appName: 'X (Twitter)', versionName: '10.34', isSystemApp: false },
    ];
  },

  /**
   * Launch an app by package name on the real device.
   */
  async launchApp(packageName: string): Promise<boolean> {
    if (Platform.OS === 'android' && AppManagerModule) {
      return await AppManagerModule.launchApp(packageName);
    }
    console.log('[AppManager] launchApp fallback:', packageName);
    return false;
  },

  /**
   * Get APK path for an installed app (requires READ_EXTERNAL_STORAGE or root).
   */
  async getApkPath(packageName: string): Promise<string | null> {
    if (Platform.OS === 'android' && AppManagerModule) {
      return await AppManagerModule.getApkPath(packageName);
    }
    return null;
  },
};
