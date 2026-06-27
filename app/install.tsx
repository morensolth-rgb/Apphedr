import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { C, R } from '../lib/theme';
import { VirtualCore } from '../lib/virtualcore';
import { addAppToInstance } from '../lib/storage';

type Step = 'pick' | 'installing' | 'done' | 'error';

export default function InstallScreen() {
  const router = useRouter();
  const { id: instanceId } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<Step>('pick');
  const [apkName, setApkName] = useState('');
  const [apkPath, setApkPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const pickAPK = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/vnd.android.package-archive',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setApkName(asset.name);
    setApkPath(asset.uri);
  };

  const install = async () => {
    if (!apkPath || !instanceId) return;
    setStep('installing');

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return p; }
        return p + Math.random() * 15;
      });
    }, 300);

    try {
      const result = await VirtualCore.installApp(instanceId, apkPath);
      clearInterval(interval);
      setProgress(100);

      if (result.success) {
        await addAppToInstance(instanceId, {
          id: Date.now().toString(),
          name: result.appName || apkName.replace('.apk', ''),
          packageName: result.packageName,
          apkPath,
          installedAt: Date.now(),
          version: '1.0',
        });
        setStep('done');
      } else {
        setErrorMsg('فشل التثبيت داخل البيئة الوهمية');
        setStep('error');
      }
    } catch (e: any) {
      clearInterval(interval);
      setErrorMsg(e.message || 'خطأ غير معروف');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('pick');
    setApkName('');
    setApkPath('');
    setProgress(0);
    setErrorMsg('');
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>تثبيت APK</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {step === 'pick' && (
          <>
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={C.accent} />
              <Text style={s.infoText}>سيتم تثبيت التطبيق داخل البيئة الوهمية فقط، لن يؤثر على النظام الحقيقي</Text>
            </View>

            <TouchableOpacity style={s.pickBtn} onPress={pickAPK}>
              <Ionicons name="folder-open-outline" size={40} color={C.primary} />
              <Text style={s.pickTitle}>
                {apkName ? apkName : 'اختر ملف APK'}
              </Text>
              <Text style={s.pickSub}>اضغط لاختيار ملف .apk من الجهاز</Text>
            </TouchableOpacity>

            {apkPath ? (
              <View style={s.apkInfo}>
                <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                <Text style={s.apkInfoText}>{apkName}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.installBtn, !apkPath && s.installBtnDisabled]}
              onPress={install}
              disabled={!apkPath}
            >
              <Ionicons name="download-outline" size={20} color={apkPath ? '#000' : C.textDim} />
              <Text style={[s.installBtnText, !apkPath && { color: C.textDim }]}>تثبيت داخل البيئة</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'installing' && (
          <View style={s.progressBox}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={s.progressTitle}>جاري التثبيت...</Text>
            <Text style={s.progressFile}>{apkName}</Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={s.progressPct}>{Math.floor(Math.min(progress, 100))}%</Text>
          </View>
        )}

        {step === 'done' && (
          <View style={s.resultBox}>
            <Ionicons name="checkmark-circle" size={72} color={C.primary} />
            <Text style={s.resultTitle}>تم التثبيت بنجاح</Text>
            <Text style={s.resultSub}>{apkName}</Text>
            <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
              <Text style={s.doneBtnText}>العودة للبيئة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.anotherBtn} onPress={reset}>
              <Text style={s.anotherText}>تثبيت تطبيق آخر</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'error' && (
          <View style={s.resultBox}>
            <Ionicons name="close-circle" size={72} color={C.danger} />
            <Text style={[s.resultTitle, { color: C.danger }]}>فشل التثبيت</Text>
            <Text style={s.resultSub}>{errorMsg}</Text>
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: C.danger }]} onPress={reset}>
              <Text style={s.doneBtnText}>المحاولة مجدداً</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  body: { padding: 20, gap: 16 },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.accent + '15', borderRadius: R.md, padding: 14,
    borderWidth: 1, borderColor: C.accent + '40',
  },
  infoText: { flex: 1, color: C.textSec, fontSize: 13, lineHeight: 20, textAlign: 'right' },
  pickBtn: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: 32,
    alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
  },
  pickTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  pickSub: { fontSize: 13, color: C.textDim },
  apkInfo: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: C.primary + '15', borderRadius: R.sm, padding: 12,
  },
  apkInfoText: { color: C.primary, fontSize: 13, flex: 1 },
  installBtn: {
    backgroundColor: C.primary, borderRadius: R.md, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  installBtnDisabled: { backgroundColor: C.surface2 },
  installBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  progressBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  progressTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  progressFile: { fontSize: 13, color: C.textSec },
  progressBar: {
    width: '100%', height: 6, backgroundColor: C.surface2,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  progressPct: { fontSize: 13, color: C.textSec },
  resultBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  resultSub: { fontSize: 14, color: C.textSec },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: R.md, paddingVertical: 14,
    paddingHorizontal: 32, marginTop: 16,
  },
  doneBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  anotherBtn: { paddingVertical: 12 },
  anotherText: { color: C.textSec, fontSize: 14 },
});
