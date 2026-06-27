/**
 * VirtualCore Bridge
 * React Native bridge to the native VirtualCore Android module.
 * Falls back to JS simulation when native module is unavailable (dev mode).
 */
import { NativeModules, Platform } from 'react-native';

const { VirtualCoreModule } = NativeModules;

const isNative = Platform.OS === 'android' && !!VirtualCoreModule;

export const VirtualCore = {
  /**
   * Initialize the virtual environment engine.
   * Must be called once at app startup.
   */
  async initialize(): Promise<boolean> {
    if (isNative) {
      return await VirtualCoreModule.initialize();
    }
    console.log('[VirtualCore] Running in simulation mode');
    return true;
  },

  /**
   * Start a virtual instance by ID.
   */
  async startInstance(instanceId: string): Promise<boolean> {
    if (isNative) {
      return await VirtualCoreModule.startInstance(instanceId);
    }
    console.log('[VirtualCore] startInstance:', instanceId);
    return true;
  },

  /**
   * Stop a running virtual instance.
   */
  async stopInstance(instanceId: string): Promise<void> {
    if (isNative) {
      return await VirtualCoreModule.stopInstance(instanceId);
    }
    console.log('[VirtualCore] stopInstance:', instanceId);
  },

  /**
   * Install APK into a virtual instance.
   * @param instanceId Target instance ID
   * @param apkPath Path to the APK file
   */
  async installApp(instanceId: string, apkPath: string): Promise<{ success: boolean; packageName: string; appName: string }> {
    if (isNative) {
      return await VirtualCoreModule.installApp(instanceId, apkPath);
    }
    // Simulation fallback
    const fakePkg = 'com.app.' + Math.random().toString(36).slice(2, 8);
    return { success: true, packageName: fakePkg, appName: 'تطبيق مثبت' };
  },

  /**
   * Uninstall an app from a virtual instance.
   */
  async uninstallApp(instanceId: string, packageName: string): Promise<boolean> {
    if (isNative) {
      return await VirtualCoreModule.uninstallApp(instanceId, packageName);
    }
    return true;
  },

  /**
   * Launch an app inside a virtual instance.
   */
  async launchApp(instanceId: string, packageName: string): Promise<boolean> {
    if (isNative) {
      return await VirtualCoreModule.launchApp(instanceId, packageName);
    }
    console.log('[VirtualCore] launchApp:', packageName, 'in', instanceId);
    return true;
  },

  /**
   * Get running status of a virtual instance.
   */
  async getInstanceStatus(instanceId: string): Promise<'running' | 'stopped' | 'error'> {
    if (isNative) {
      return await VirtualCoreModule.getInstanceStatus(instanceId);
    }
    return 'stopped';
  },
};
