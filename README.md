# VirtualDroid 🤖

محاكي بيئات Android وهمية — تشغيل تطبيقات معزولة مع دعم Root وهمي وتغيير هوية الجهاز.

## الميزات

- **Multi-Instance** — إنشاء عدة بيئات Android معزولة
- **APK Install** — تثبيت أي APK داخل البيئة الوهمية
- **Fake Root** — محاكاة صلاحيات root داخل البيئة فقط
- **Device Spoofing** — تغيير Device ID, IMEI, model, fingerprint
- **واجهة عربية** — UI كامل بالعربية

## البنية التقنية

```
app/               ← شاشات React Native (Expo Router)
├── index.tsx      ← الشاشة الرئيسية (قائمة البيئات)
├── instance.tsx   ← داخل بيئة (التطبيقات المثبتة)
├── install.tsx    ← تثبيت APK
├── device-settings.tsx ← إعدادات الجهاز والـ spoofing
└── settings.tsx   ← إعدادات التطبيق

lib/
├── virtualcore.ts ← Bridge للـ native module
├── spoofing.ts    ← Bridge لـ Device Spoofing
└── storage.ts     ← تخزين البيانات محلياً

android/           ← Native modules (Kotlin)
├── VirtualCoreModule.kt   ← React Native bridge
├── DeviceSpoofingModule.kt
├── VirtualDroidPackage.kt
└── VirtualEngine.kt       ← محرك البيئات الوهمية
```

## المتطلبات

- Android 10+ (API 29+)
- جهاز مفتوح root (Magisk)
- صلاحيات: INSTALL_PACKAGES, READ_PHONE_STATE

## البناء

```bash
# تثبيت dependencies
npm install

# بناء APK (يحتاج EAS CLI)
eas build --platform android --profile preview
```

## المحرك الأساسي

يعتمد على مبدأ [VirtualApp](https://github.com/asLody/VirtualApp) لعزل العمليات.  
لإضافة VirtualApp core:
```gradle
// android/app/build.gradle
implementation 'com.github.asLody:VirtualApp:2.0'
```

## ⚠️ تحذير

هذا التطبيق مخصص للبحث الأمني واختبار التطبيقات. استخدمه بمسؤولية.
