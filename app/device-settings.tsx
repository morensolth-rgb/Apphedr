import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../lib/theme';
import { getInstances, updateInstance, VirtualInstance } from '../lib/storage';
import { DeviceSpoofing, DeviceProfile } from '../lib/spoofing';

export default function DeviceSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [instance, setInstance] = useState<VirtualInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [editField, setEditField] = useState<keyof VirtualInstance | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = useCallback(async () => {
    const all = await getInstances();
    setInstance(all.find(i => i.id === id) || null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleRoot = async () => {
    if (!instance) return;
    const next = !instance.fakeRoot;
    Alert.alert(
      next ? 'تفعيل Root وهمي' : 'إيقاف Root',
      next
        ? 'سيتم محاكاة صلاحيات Root داخل البيئة الوهمية فقط'
        : 'سيتم إيقاف Root داخل البيئة',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setApplying(true);
            await DeviceSpoofing.setFakeRoot(instance.id, next);
            await updateInstance(instance.id, { fakeRoot: next });
            await load();
            setApplying(false);
          },
        },
      ]
    );
  };

  const randomizeDevice = async () => {
    if (!instance) return;
    Alert.alert('تغيير عشوائي', 'سيتم توليد هوية جهاز جديدة كاملة', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'توليد',
        onPress: async () => {
          setApplying(true);
          const profile: DeviceProfile = DeviceSpoofing.generateRandomProfile();
          await DeviceSpoofing.applyProfile(instance.id, profile);
          await updateInstance(instance.id, {
            deviceId: profile.androidId,
            imei: profile.imei,
            deviceModel: profile.deviceModel,
            androidVersion: profile.androidVersion,
          });
          await load();
          setApplying(false);
        },
      },
    ]);
  };

  const saveField = async () => {
    if (!instance || !editField) return;
    await updateInstance(instance.id, { [editField]: editValue });
    setEditField(null);
    load();
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.primary} /></View>;
  }
  if (!instance) {
    return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.textSec }}>غير موجود</Text></View>;
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>إعدادات الجهاز</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Root */}
        <Section title="صلاحيات Root">
          <Row
            icon="skull-outline"
            label="تفعيل Root وهمي"
            sub="يحاكي صلاحيات root داخل البيئة فقط"
            right={
              applying
                ? <ActivityIndicator color={C.primary} />
                : <Switch value={instance.fakeRoot} onValueChange={toggleRoot} thumbColor={instance.fakeRoot ? C.primary : C.surface3} trackColor={{ true: C.primary + '50', false: C.surface2 }} />
            }
          />
        </Section>

        {/* Device Identity */}
        <Section title="هوية الجهاز">
          <EditableRow label="Device ID" value={instance.deviceId} onEdit={() => { setEditField('deviceId'); setEditValue(instance.deviceId); }} />
          <EditableRow label="IMEI" value={instance.imei} onEdit={() => { setEditField('imei'); setEditValue(instance.imei); }} />
          <EditableRow label="الموديل" value={instance.deviceModel} onEdit={() => { setEditField('deviceModel'); setEditValue(instance.deviceModel); }} />
          <EditableRow label="Android" value={instance.androidVersion} onEdit={() => { setEditField('androidVersion'); setEditValue(instance.androidVersion); }} />
        </Section>

        {/* Actions */}
        <Section title="إجراءات">
          <TouchableOpacity style={s.actionBtn} onPress={randomizeDevice}>
            <Ionicons name="shuffle-outline" size={20} color={C.accent} />
            <View style={s.actionInfo}>
              <Text style={s.actionLabel}>توليد هوية عشوائية</Text>
              <Text style={s.actionSub}>يغير Device ID, IMEI, الموديل دفعة واحدة</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { borderColor: C.danger + '40' }]}
            onPress={() => Alert.alert('تصفير', 'هل تريد إعادة ضبط كل الإعدادات للقيم الأصلية؟', [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'تصفير', style: 'destructive', onPress: async () => { await DeviceSpoofing.resetProfile(instance.id); load(); } },
            ])}
          >
            <Ionicons name="refresh-outline" size={20} color={C.danger} />
            <View style={s.actionInfo}>
              <Text style={[s.actionLabel, { color: C.danger }]}>تصفير الإعدادات</Text>
              <Text style={s.actionSub}>إعادة القيم للجهاز الحقيقي</Text>
            </View>
          </TouchableOpacity>
        </Section>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editField} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>تعديل {editField}</Text>
            <TextInput
              style={s.input}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              placeholderTextColor={C.textDim}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditField(null)}>
                <Text style={s.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveField}>
                <Text style={s.saveText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ss.section}>
      <Text style={ss.sectionTitle}>{title}</Text>
      <View style={ss.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ icon, label, sub, right }: { icon: any; label: string; sub?: string; right: React.ReactNode }) {
  return (
    <View style={ss.row}>
      <Ionicons name={icon} size={20} color={C.primary} />
      <View style={ss.rowInfo}>
        <Text style={ss.rowLabel}>{label}</Text>
        {sub && <Text style={ss.rowSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

function EditableRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <TouchableOpacity style={ss.row} onPress={onEdit}>
      <View style={ss.rowInfo}>
        <Text style={ss.rowLabel}>{label}</Text>
        <Text style={ss.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      <Ionicons name="pencil-outline" size={16} color={C.textDim} />
    </TouchableOpacity>
  );
}

const ss = StyleSheet.create({
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'right' },
  sectionBody: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right' },
  rowSub: { fontSize: 12, color: C.textSec, marginTop: 2, textAlign: 'right' },
  rowValue: { fontSize: 12, color: C.textSec, marginTop: 2, textAlign: 'right' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  body: { padding: 16, gap: 16 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right' },
  actionSub: { fontSize: 12, color: C.textSec, marginTop: 2, textAlign: 'right' },
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', alignItems: 'center' },
  modal: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 24,
    width: '85%', borderWidth: 1, borderColor: C.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 14, textAlign: 'right' },
  input: {
    backgroundColor: C.surface2, borderRadius: R.sm, padding: 12,
    color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: C.surface2, borderRadius: R.sm, padding: 12, alignItems: 'center' },
  cancelText: { color: C.textSec, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: C.primary, borderRadius: R.sm, padding: 12, alignItems: 'center' },
  saveText: { color: '#000', fontWeight: '800' },
});
