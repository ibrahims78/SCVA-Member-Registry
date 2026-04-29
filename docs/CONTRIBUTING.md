# دليل المساهمة / Contributing Guide

نشكرك على اهتمامك بالمساهمة في **نظام إدارة أعضاء SCVA**! يساعدنا هذا الدليل على إبقاء المشروع منظّماً وعالي الجودة.

Thank you for your interest in contributing to the **SCVA Members Management System**! This guide helps keep the project organized and high-quality.

---

## 📋 جدول المحتويات

- [قواعد السلوك](#-قواعد-السلوك)
- [كيف أبدأ؟](#-كيف-أبدأ)
- [سير العمل](#-سير-العمل)
- [معايير الكود](#-معايير-الكود)
- [اتفاقية الـ Commits](#-اتفاقية-الـ-commits)
- [Pull Requests](#-pull-requests)
- [الإبلاغ عن المشاكل](#-الإبلاغ-عن-المشاكل)

---

## 🤝 قواعد السلوك

نتوقّع من جميع المساهمين الالتزام بـ [ميثاق السلوك](CODE_OF_CONDUCT.md). كن محترماً، شاملاً، وبنّاءً.

---

## 🚀 كيف أبدأ؟

### 1. إعداد البيئة محلياً

```bash
# Fork المستودع من واجهة GitHub، ثم:
git clone https://github.com/<your-username>/scva-members.git
cd scva-members
npm install
cp .env.example .env
# عدّل القيم في .env
npm run db:push
npm run dev
```

### 2. إيجاد مهمّة مناسبة

- تصفّح [قائمة Issues](../../issues) وابحث عن وسوم `good first issue` أو `help wanted`.
- لو كانت لديك فكرة جديدة، افتح Issue للنقاش قبل البدء بالعمل.

---

## 🔄 سير العمل

```bash
# 1) أنشئ فرعاً للميزة من main
git checkout main
git pull origin main
git checkout -b feat/<short-description>

# 2) اكتب الكود + اختبر التغييرات يدوياً
npm run check     # فحص أنواع TypeScript
npm run build     # تأكّد من نجاح البناء

# 3) Commit مع رسائل واضحة (انظر اتفاقية Conventional Commits)
git add .
git commit -m "feat(members): add bulk delete action"

# 4) ادفع وافتح Pull Request
git push origin feat/<short-description>
```

### تسمية الفروع

| النوع | المثال |
|---|---|
| ميزة جديدة | `feat/subscription-edit-dialog` |
| إصلاح خطأ | `fix/pdf-arabic-shaping` |
| توثيق | `docs/update-readme` |
| إعادة هيكلة | `refactor/storage-interface` |
| اختبارات | `test/members-pagination` |
| مهام صيانة | `chore/upgrade-deps` |

---

## 🎨 معايير الكود

### TypeScript
- وضع **strict** مفعّل — تجنّب `any` قدر الإمكان.
- استخدم الأنواع المُصدَّرة من `@shared/schema` بدل تكرار التعريفات.
- اكتب أنواع صريحة لـ exports العامّة.

### React (Frontend)
- استخدم **Hooks** بدل Class Components.
- جميع طلبات البيانات عبر **TanStack Query** (لا تستخدم `useEffect + fetch`).
- النماذج عبر `react-hook-form` + `zodResolver`.
- استخدم مكوّنات `shadcn/ui` الموجودة في `client/src/components/ui/` بدل إعادة تصميم نفس المكوّن.
- أضف `data-testid` لكل عنصر تفاعلي جديد، بصيغة `{action}-{target}` (مثل `button-save-payment`).

### Backend (Express)
- جميع المسارات الجديدة تمرّ بـ `requireAuth` (إلا لو كان عامّاً عمداً).
- جميع طلبات الكتابة تتحقّق بـ Zod من `@shared/schema`.
- استخدم طبقة `IStorage` فقط — لا تستدعِ Drizzle مباشرة من الـ routes.
- أعد رسائل خطأ عربية واضحة في `res.status(...).json({ message })`.

### الواجهة وأسلوب العرض
- دعم RTL أساسي — استخدم `start/end` بدل `left/right`.
- جميع النصوص الجديدة في كلا اللغتين (`isAr ? "..." : "..."`).
- ارجع لـ `replit.md` و `docs/DESIGN_SYSTEM.md` لمعرفة المعايير البصرية.

---

## 📝 اتفاقية الـ Commits

نتّبع [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### الأنواع المسموحة

| Type | الاستخدام |
|---|---|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | تغييرات توثيق فقط |
| `style` | تنسيق (لا يؤثّر على الكود) |
| `refactor` | إعادة هيكلة بدون تغيير سلوك |
| `perf` | تحسين أداء |
| `test` | إضافة / تعديل اختبارات |
| `chore` | مهام صيانة (تحديث اعتمادات، ...) |
| `ci` | تغييرات CI / CD |
| `build` | تغييرات نظام البناء |

### أمثلة جيّدة

```
feat(members): add pagination to members list
fix(pdf): resolve Arabic text shaping in subscription table
docs(readme): add deployment section
refactor(storage): extract subscription queries into helper
chore(deps): upgrade drizzle-orm to 0.40.0
```

---

## ✅ Pull Requests

قبل فتح PR، تأكّد من:

- [ ] الفرع محدّث من `main`.
- [ ] `npm run check` ينجح بدون أخطاء جديدة.
- [ ] `npm run build` ينجح.
- [ ] اختبرت التغيير يدوياً في كلا اللغتين (عربي + إنجليزي).
- [ ] أضفت `data-testid` لأيّ عناصر تفاعلية جديدة.
- [ ] حدّثت `README.md` أو `replit.md` إن كان التغيير يستدعي ذلك.
- [ ] رسائل الـ Commits تتّبع Conventional Commits.

ثم املأ قالب الـ PR (سيظهر تلقائياً) بدقّة.

---

## 🐛 الإبلاغ عن المشاكل

- **خطأ تقني**: استخدم قالب [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md).
- **اقتراح ميزة**: استخدم قالب [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md).
- **ثغرة أمنية**: لا تفتح Issue عام — راجع [SECURITY.md](SECURITY.md).

---

شكراً لمساهمتك! 🌟
Thank you for contributing! 🌟
