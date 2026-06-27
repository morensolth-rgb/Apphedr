import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../lib/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>الإعدادات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* App Info */}
        <View style={s.appCard}>
          <View style={s.appIconBox}>
            <Ionicons name="phone-portrait" size={36} color={C.primary} />
          </View>
          <Text style={s.appName}>VirtualDroid</Text>
          <Text style={s.appVersion}>v1.0.0 • محاكي البيئات الوهمية</Text>
        </View>

        <Section title="المحرك">
          <SettingRow
            icon="cpu-outline"
            label="محرك VirtualCore"
            value="نشط"
            valueColor={C.primary}
          />
          <SettingRow
            icon="layers-outline"
            label="الإصدار المدعوم"
            value="Android 10 – 14"
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Root مطلوب"
            value="نعم (للميزات الكاملة)"
            valueColor={C.warning}
          />
        </Section>

        <Section title="الخصوصية">
          <SettingRow
            icon="eye-off-outline"
            label="عزل البيانات"
            value="كل بيئة معزولة تماماً"
          />
          <SettingRow
            icon="lock-closed-outline"
            label="التخزين"
            value="محلي فقط، لا سحابة"
          />
        </Section>

        <Section title="حول التطبيق">
          <SettingRow icon="code-outline" label="المطور" value="Hedr Mhmd" />
          <SettingRow icon="git-branch-outline" label="المستودع" value="morensolth-rgb/Apphedr" />
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => Linking.openURL('https://github.com/morensolth-rgb/Apphedr')}
          >
            <Ionicons name="logo-github" size={20} color={C.textSec} />
            <Text style={s.linkText}>GitHub</Text>
            <Ionicons name="open-outline" size={16} color={C.textDim} />
          </TouchableOpacity>
        </Section>

        {/* Warning */}
        <View style={s.warning}>
          <Ionicons name="warning-outline" size={18} color={C.warning} />
          <Text style={s.warningText}>
            هذا التطبيق مخصص للبحث الأمني واختبار التطبيقات. استخدمه بمسؤولية وفق قوانين منطقتك.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      <View style={sec.body}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, value, valueColor }: {
  icon: any; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={sec.row}>
      <Ionicons name={icon} size={18} color={C.textSec} />
      <Text style={sec.label}>{label}</Text>
      <Text style={[sec.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'right' },
  body: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  label: { flex: 1, fontSize: 14, color: C.text, textAlign: 'right' },
  value: { fontSize: 13, color: C.textSec },
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
  appCard: {
    alignItems: 'center', padding: 24, gap: 8,
    backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.border,
  },
  appIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center',
  },
  appName: { fontSize: 22, fontWeight: '800', color: C.text },
  appVersion: { fontSize: 13, color: C.textSec },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  linkText: { flex: 1, fontSize: 14, color: C.accent, textAlign: 'right' },
  warning: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.warning + '15', borderRadius: R.md, padding: 14,
    borderWidth: 1, borderColor: C.warning + '40',
  },
  warningText: { flex: 1, color: C.textSec, fontSize: 12, lineHeight: 18, textAlign: 'right' },
});
