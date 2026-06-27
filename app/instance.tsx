import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, R } from '../lib/theme';
import {
  getInstances, VirtualInstance, InstalledApp, removeAppFromInstance,
} from '../lib/storage';
import { VirtualCore } from '../lib/virtualcore';

export default function InstanceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [instance, setInstance] = useState<VirtualInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all = await getInstances();
    const found = all.find(i => i.id === id) || null;
    setInstance(found);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleLaunch = async (app: InstalledApp) => {
    if (!instance) return;
    setLaunchingApp(app.id);
    const ok = await VirtualCore.launchApp(instance.id, app.packageName);
    setLaunchingApp(null);
    if (!ok) Alert.alert('خطأ', 'فشل تشغيل التطبيق داخل البيئة الوهمية');
  };

  const handleUninstall = (app: InstalledApp) => {
    Alert.alert('إلغاء تثبيت', `هل تريد إزالة "${app.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إزالة', style: 'destructive',
        onPress: async () => {
          if (!instance) return;
          await removeAppFromInstance(instance.id, app.id);
          load();
        },
      },
    ]);
  };

  const renderApp = ({ item }: { item: InstalledApp }) => (
    <TouchableOpacity
      style={s.appCard}
      onPress={() => handleLaunch(item)}
      onLongPress={() => handleUninstall(item)}
    >
      <View style={s.appIcon}>
        <Ionicons name="logo-android" size={26} color={C.primary} />
      </View>
      <View style={s.appInfo}>
        <Text style={s.appName}>{item.name}</Text>
        <Text style={s.appPkg}>{item.packageName}</Text>
        <Text style={s.appVer}>v{item.version}</Text>
      </View>
      {launchingApp === item.id
        ? <ActivityIndicator color={C.primary} />
        : <Ionicons name="play-circle-outline" size={28} color={C.primary} />
      }
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!instance) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.textSec }}>البيئة غير موجودة</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>{instance.name}</Text>
          <Text style={s.subtitle}>Android {instance.androidVersion}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/device-settings', params: { id: instance.id } })}
        >
          <Ionicons name="hardware-chip-outline" size={24} color={C.textSec} />
        </TouchableOpacity>
      </View>

      {/* Info Bar */}
      <View style={s.infoBar}>
        <InfoChip icon="phone-portrait-outline" label={instance.deviceModel} />
        <InfoChip icon="finger-print-outline" label={instance.deviceId.slice(0, 8) + '...'} />
        {instance.fakeRoot && <InfoChip icon="skull-outline" label="ROOT" color={C.primary} />}
      </View>

      {/* Apps */}
      <FlatList
        data={instance.apps}
        keyExtractor={a => a.id}
        renderItem={renderApp}
        contentContainerStyle={instance.apps.length === 0 ? s.empty : { padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="apps" size={64} color={C.textDim} />
            <Text style={s.emptyTitle}>لا توجد تطبيقات</Text>
            <Text style={s.emptyText}>اضغط + لتثبيت APK داخل البيئة</Text>
          </View>
        }
      />

      {/* Install FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push({ pathname: '/install', params: { id: instance.id } })}
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function InfoChip({ icon, label, color }: { icon: any; label: string; color?: string }) {
  return (
    <View style={[ic.chip, color ? { borderColor: color + '50' } : {}]}>
      <Ionicons name={icon} size={12} color={color || C.textSec} />
      <Text style={[ic.text, color ? { color } : {}]}>{label}</Text>
    </View>
  );
}

const ic = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surface2, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  text: { fontSize: 11, color: C.textSec, fontWeight: '600' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 12, color: C.textSec },
  infoBar: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  appCard: {
    backgroundColor: C.card, borderRadius: R.md, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  appIcon: {
    width: 48, height: 48, borderRadius: R.sm,
    backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center',
  },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '700', color: C.text },
  appPkg: { fontSize: 11, color: C.textDim, marginTop: 2 },
  appVer: { fontSize: 11, color: C.textSec, marginTop: 1 },
  empty: { flex: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textSec },
  emptyText: { fontSize: 14, color: C.textDim },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12,
  },
});
