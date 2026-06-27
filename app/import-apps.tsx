import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../lib/theme';
import { addAppToInstance } from '../lib/storage';
import { AppManager, InstalledDeviceApp } from '../modules/app-manager/src/index';

export default function ImportAppsScreen() {
  const router = useRouter();
  const { id: instanceId } = useLocalSearchParams<{ id: string }>();
  const [apps, setApps] = useState<InstalledDeviceApp[]>([]);
  const [filtered, setFiltered] = useState<InstalledDeviceApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const list = await AppManager.getInstalledApps();
    // Sort: user apps first, alphabetically
    list.sort((a, b) => a.appName.localeCompare(b.appName));
    setApps(list);
    setFiltered(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(apps);
      return;
    }
    const q = search.trim().toLowerCase();
    setFiltered(apps.filter(a =>
      a.appName.toLowerCase().includes(q) ||
      a.packageName.toLowerCase().includes(q)
    ));
  }, [search, apps]);

  const handleImport = async (app: InstalledDeviceApp) => {
    if (!instanceId) return;
    if (imported.has(app.packageName)) {
      Alert.alert('تم الاستيراد مسبقاً', `"${app.appName}" موجود بالفعل في البيئة`);
      return;
    }

    setImporting(prev => new Set(prev).add(app.packageName));

    try {
      // Try to get actual APK path
      const apkPath = await AppManager.getApkPath(app.packageName);

      await addAppToInstance(instanceId, {
        id: Date.now().toString() + app.packageName,
        name: app.appName,
        packageName: app.packageName,
        apkPath: apkPath || '',
        installedAt: Date.now(),
        version: app.versionName,
      });

      setImported(prev => new Set(prev).add(app.packageName));
    } catch (e: any) {
      Alert.alert('فشل الاستيراد', e.message || 'خطأ غير معروف');
    } finally {
      setImporting(prev => {
        const next = new Set(prev);
        next.delete(app.packageName);
        return next;
      });
    }
  };

  const renderApp = ({ item }: { item: InstalledDeviceApp }) => {
    const isImporting = importing.has(item.packageName);
    const isDone = imported.has(item.packageName);

    return (
      <View style={s.appRow}>
        <View style={s.appIcon}>
          <Ionicons name="logo-android" size={22} color={isDone ? C.primary : C.textSec} />
        </View>
        <View style={s.appInfo}>
          <Text style={s.appName}>{item.appName}</Text>
          <Text style={s.appPkg} numberOfLines={1}>{item.packageName}</Text>
          <Text style={s.appVer}>v{item.versionName}</Text>
        </View>
        <TouchableOpacity
          style={[s.importBtn, isDone && s.importBtnDone, isImporting && s.importBtnLoading]}
          onPress={() => handleImport(item)}
          disabled={isImporting || isDone}
        >
          {isImporting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : isDone ? (
            <Ionicons name="checkmark" size={18} color="#000" />
          ) : (
            <Ionicons name="add" size={18} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>استيراد من الهاتف</Text>
        <Text style={s.count}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={C.textDim} />
        <TextInput
          style={s.searchInput}
          placeholder="ابحث عن تطبيق..."
          placeholderTextColor={C.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Info */}
      <View style={s.infoBar}>
        <Ionicons name="information-circle-outline" size={15} color={C.accent} />
        <Text style={s.infoText}>
          سيتم نسخ التطبيق إلى البيئة الوهمية — لن يتأثر النظام الأصلي
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={s.loadingText}>جاري قراءة التطبيقات...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.packageName}
          renderItem={renderApp}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="apps-outline" size={48} color={C.textDim} />
              <Text style={s.emptyText}>لا توجد نتائج</Text>
            </View>
          }
        />
      )}

      {/* Bottom summary */}
      {imported.size > 0 && (
        <View style={s.bottomBar}>
          <Text style={s.bottomText}>تم استيراد {imported.size} تطبيق</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
            <Text style={s.doneBtnText}>انتهيت</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  count: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 12, backgroundColor: C.surface2, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },
  infoBar: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    marginHorizontal: 12, marginBottom: 4,
    backgroundColor: C.accent + '12', borderRadius: R.sm, padding: 10,
    borderWidth: 1, borderColor: C.accent + '30',
  },
  infoText: { flex: 1, color: C.textSec, fontSize: 12, lineHeight: 18, textAlign: 'right' },
  appRow: {
    backgroundColor: C.card, borderRadius: R.md, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.border,
  },
  appIcon: {
    width: 44, height: 44, borderRadius: R.sm,
    backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center',
  },
  appInfo: { flex: 1 },
  appName: { fontSize: 14, fontWeight: '700', color: C.text },
  appPkg: { fontSize: 11, color: C.textDim, marginTop: 2 },
  appVer: { fontSize: 11, color: C.textSec, marginTop: 1 },
  importBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  importBtnDone: { backgroundColor: C.primary + 'AA' },
  importBtnLoading: { backgroundColor: C.surface2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: C.textSec, fontSize: 14 },
  emptyText: { color: C.textSec, fontSize: 15 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  bottomText: { color: C.primary, fontWeight: '700', fontSize: 14 },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: R.sm,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  doneBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
});
