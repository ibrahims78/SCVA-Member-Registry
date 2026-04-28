# Pull Request

## 📌 الوصف / Description
<!-- اشرح التغييرات بإيجاز / Brief description of changes -->


## 🔗 Issue المرتبطة / Related Issue
<!-- مثال: Closes #123 -->
Closes #


## 🧩 نوع التغيير / Type of Change
<!-- ضع علامة [x] على المناسب / Check the relevant box -->

- [ ] 🐛 إصلاح خطأ / Bug fix (تغيير لا يكسر شيئاً، يصلح مشكلة)
- [ ] ✨ ميزة جديدة / New feature (تغيير لا يكسر شيئاً، يضيف وظيفة)
- [ ] 💥 تغيير كاسر / Breaking change (يتطلّب تحديث المستخدمين)
- [ ] 📝 توثيق / Documentation update
- [ ] 🎨 تنسيق / Style / formatting
- [ ] ♻️ إعادة هيكلة / Refactor (بدون تغيير سلوك)
- [ ] ⚡ أداء / Performance improvement
- [ ] ✅ اختبارات / Tests
- [ ] 🔧 إعدادات / Build / CI / config


## 📸 لقطات شاشة / Screenshots
<!-- لتغييرات الواجهة، أرفق صور قبل/بعد / For UI changes, attach before/after -->

| قبل / Before | بعد / After |
|---|---|
|  |  |


## ☑️ قائمة التحقّق / Checklist

### عام / General
- [ ] قرأتُ [دليل المساهمة](../CONTRIBUTING.md)
- [ ] الكود يتّبع معايير المشروع
- [ ] أجريتُ مراجعة ذاتية للتغييرات
- [ ] علّقتُ على الأجزاء المعقّدة من الكود (عند الحاجة فقط)
- [ ] رسائل الـ Commits تتّبع [Conventional Commits](https://www.conventionalcommits.org/)

### الجودة / Quality
- [ ] `npm run check` ينجح بدون أخطاء جديدة
- [ ] `npm run build` ينجح
- [ ] اختبرتُ التغيير يدوياً في كلا اللغتين (عربي ✅ + إنجليزي ✅)
- [ ] اختبرتُ في الوضع الفاتح والداكن
- [ ] أضفتُ `data-testid` لأيّ عناصر تفاعلية جديدة
- [ ] لا توجد أخطاء أو تحذيرات جديدة في Console

### التوثيق / Documentation
- [ ] حدّثتُ `README.md` (إن لزم)
- [ ] حدّثتُ `replit.md` (إن غيّرت المعمارية)
- [ ] حدّثتُ `.env.example` (إن أضفت متغيّر بيئة)

### الأمان / Security
- [ ] لا تحتوي التغييرات على أسرار أو توكنات
- [ ] طلبات الكتابة الجديدة تتحقّق بـ Zod
- [ ] المسارات الجديدة محميّة بـ `requireAuth` (إن لزم)


## 📋 ملاحظات للمراجعين / Notes for Reviewers
<!-- أيّ شيء تودّ لفت انتباه المراجعين إليه -->
