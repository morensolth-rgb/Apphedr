import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../lib/theme';
import { getInstances, createInstance, deleteInstance, VirtualInstance } from '../lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [instances, setInstances] = useState<VirtualInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const data = await getInstances();
    setInstances(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createInstance(newName.trim());
    setNewName('');
    setModalVisible(false);
    setCreating(false);
    load();
  };

  const handleDelete = (item: VirtualInstance) => {
    Alert.alert('حذف البيئة', `هل تريد حذف "${item.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => { await deleteInstance(item.id); load(); },
      },
    ]);
  };

  const renderInstance = ({ item }: { item: VirtualInstance }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: '/instance', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={s.cardIcon}>
        <Ionicons name="phone-portrait-outline" size={28} color={C.primary} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardName}>{item.name}</Text>
        <Text style={s.cardSub}>Android {item.androidVersion} • {item.deviceModel}</Text>
        <Text style={s.cardSub}>{item.apps.length} تطبيق</Text>
      </View>
      <View style={s.cardRight}>
        {item.fakeRoot && (
          <View style={s.rootBadge}>
            <Text style={s.rootBadgeText}>ROOT</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={C.textDim} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>VirtualDroid</Text>
          <Text style={s.subtitle}>{instances.length} بيئة وهمية</Text>
        </View>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={C.textSec} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={instances}
          keyExtractor={i => i.id}
          renderItem={renderInstance}
          contentContainerStyle={instances.length === 0 ? s.empty : { padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="phone-portrait-outline" size={64} color={C.textDim} />
              <Text style={s.emptyTitle}>لا توجد بيئات</Text>
              <Text style={s.emptyText}>اضغط + لإنشاء بيئة وهمية جديدة</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>بيئة جديدة</Text>
            <TextInput
              style={s.input}
              placeholder="اسم البيئة (مثال: اختبار 1)"
              placeholderTextColor={C.textDim}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.createBtn} onPress={handleCreate} disabled={creating}>
                {creating
                  ? <ActivityIndicator color="#000" />
                  : <Text style={s.createText}>إنشاء</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13, color: C.textSec, marginTop: 2 },
  settingsBtn: { padding: 8 },
  card: {
    backgroundColor: C.card, borderRadius: R.md, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: R.md,
    backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 12, color: C.textSec, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rootBadge: {
    backgroundColor: C.primary + '25', borderWidth: 1, borderColor: C.primary,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  rootBadgeText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  empty: { flex: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textSec },
  emptyText: { fontSize: 14, color: C.textDim },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12,
  },
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', alignItems: 'center' },
  modal: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 24,
    width: '85%', borderWidth: 1, borderColor: C.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16, textAlign: 'right' },
  input: {
    backgroundColor: C.surface2, borderRadius: R.sm, padding: 14,
    color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border,
    textAlign: 'right', marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: C.surface2, borderRadius: R.sm,
    padding: 14, alignItems: 'center',
  },
  cancelText: { color: C.textSec, fontWeight: '600' },
  createBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: R.sm,
    padding: 14, alignItems: 'center',
  },
  createText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
