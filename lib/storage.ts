import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VirtualInstance {
  id: string;
  name: string;
  androidVersion: string;
  deviceModel: string;
  deviceId: string;
  imei: string;
  fakeRoot: boolean;
  apps: InstalledApp[];
  createdAt: number;
}

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  apkPath: string;
  icon?: string;
  installedAt: number;
  version: string;
}

const INSTANCES_KEY = 'vd_instances';

export async function getInstances(): Promise<VirtualInstance[]> {
  const raw = await AsyncStorage.getItem(INSTANCES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveInstances(instances: VirtualInstance[]): Promise<void> {
  await AsyncStorage.setItem(INSTANCES_KEY, JSON.stringify(instances));
}

export async function createInstance(name: string): Promise<VirtualInstance> {
  const instance: VirtualInstance = {
    id: Date.now().toString(),
    name,
    androidVersion: '13',
    deviceModel: 'Pixel 7 Pro',
    deviceId: generateDeviceId(),
    imei: generateIMEI(),
    fakeRoot: false,
    apps: [],
    createdAt: Date.now(),
  };
  const all = await getInstances();
  await saveInstances([...all, instance]);
  return instance;
}

export async function updateInstance(id: string, updates: Partial<VirtualInstance>): Promise<void> {
  const all = await getInstances();
  const idx = all.findIndex(i => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    await saveInstances(all);
  }
}

export async function deleteInstance(id: string): Promise<void> {
  const all = await getInstances();
  await saveInstances(all.filter(i => i.id !== id));
}

export async function addAppToInstance(instanceId: string, app: InstalledApp): Promise<void> {
  const all = await getInstances();
  const idx = all.findIndex(i => i.id === instanceId);
  if (idx >= 0) {
    all[idx].apps = [...all[idx].apps, app];
    await saveInstances(all);
  }
}

export async function removeAppFromInstance(instanceId: string, appId: string): Promise<void> {
  const all = await getInstances();
  const idx = all.findIndex(i => i.id === instanceId);
  if (idx >= 0) {
    all[idx].apps = all[idx].apps.filter(a => a.id !== appId);
    await saveInstances(all);
  }
}

function generateDeviceId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

function generateIMEI(): string {
  const base = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  return base + luhn(base);
}

function luhn(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = parseInt(n[n.length - 1 - i]);
    if (i % 2 === 0) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}
