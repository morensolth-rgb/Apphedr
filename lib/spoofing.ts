/**
 * DeviceSpoofing Bridge
 * Controls device fingerprint, IMEI, Android ID spoofing.
 * Requires root on the host device.
 */
import { NativeModules, Platform } from 'react-native';

const { DeviceSpoofingModule } = NativeModules;
const isNative = Platform.OS === 'android' && !!DeviceSpoofingModule;

export interface DeviceProfile {
  androidId: string;
  imei: string;
  deviceModel: string;
  manufacturer: string;
  androidVersion: string;
  buildFingerprint: string;
  serialNumber: string;
}

export const DeviceSpoofing = {
  /**
   * Apply a full device profile to a virtual instance.
   */
  async applyProfile(instanceId: string, profile: DeviceProfile): Promise<boolean> {
    if (isNative) {
      return await DeviceSpoofingModule.applyProfile(instanceId, profile);
    }
    console.log('[Spoofing] applyProfile to', instanceId, profile);
    return true;
  },

  /**
   * Generate a random realistic device profile.
   */
  generateRandomProfile(): DeviceProfile {
    const models = [
      { model: 'Pixel 7 Pro', manufacturer: 'Google', fp: 'google/cheetah/cheetah:13/TQ3A.230901.001/10750268:user/release-keys' },
      { model: 'SM-S918B', manufacturer: 'Samsung', fp: 'samsung/dm3qxxx/dm3q:13/TP1A.220624.014/S918BXXS3BWL1:user/release-keys' },
      { model: 'CPH2449', manufacturer: 'OPPO', fp: 'OPPO/CPH2449/OP5929L1:13/TP1A.220624.014/1683451828:user/release-keys' },
      { model: 'M2101K7BNY', manufacturer: 'Xiaomi', fp: 'xiaomi/alioth/alioth:13/RKQ1.211001.001/V14.0.2.0.TKHCNXM:user/release-keys' },
    ];
    const pick = models[Math.floor(Math.random() * models.length)];
    return {
      androidId: randomHex(16),
      imei: generateIMEI(),
      deviceModel: pick.model,
      manufacturer: pick.manufacturer,
      androidVersion: '13',
      buildFingerprint: pick.fp,
      serialNumber: randomHex(8).toUpperCase(),
    };
  },

  /**
   * Enable or disable fake root for a virtual instance.
   */
  async setFakeRoot(instanceId: string, enabled: boolean): Promise<boolean> {
    if (isNative) {
      return await DeviceSpoofingModule.setFakeRoot(instanceId, enabled);
    }
    console.log('[Spoofing] fakeRoot =', enabled, 'for', instanceId);
    return true;
  },

  /**
   * Reset all spoofing to real device values.
   */
  async resetProfile(instanceId: string): Promise<boolean> {
    if (isNative) {
      return await DeviceSpoofingModule.resetProfile(instanceId);
    }
    return true;
  },
};

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateIMEI(): string {
  const base = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    let d = parseInt(base[base.length - 1 - i]);
    if (i % 2 === 0) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  return base + ((10 - (sum % 10)) % 10).toString();
}
