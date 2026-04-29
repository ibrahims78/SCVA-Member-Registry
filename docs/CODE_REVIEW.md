# تقرير المراجعة الاحترافية للكود — مشروع SCVA Members

> **الجمهور المستهدف:** الفريق التقني للجمعية القلبية السورية (SCVA).
> **تاريخ المراجعة:** 29 نيسان/أبريل 2026.
> **نطاق المراجعة:** المستودع كاملاً — الواجهة الأمامية (`client/`)، الخلفية (`server/`)، المخططات المشتركة (`shared/`)، إعدادات النشر (`Dockerfile`، `docker-compose.yml`)، ملفات GitHub (`.github/`)، والوثائق (`docs/`، `README.md`).
> **منهجية المراجعة:** قراءة جميع الملفات الرئيسية، تشغيل `tsc` للتحقق الثابت، تفتيش الأنماط الشائعة (تسرّب الأسرار، الاستعلامات المتكرّرة، الثغرات الأمنية، تعطّل التحويل البرمجي)، وفحص اتساق الوثائق مع الواقع البرمجي.

---

## 1. ملخّص تنفيذي

المشروع **متماسك وحرفيّ في معظم جوانبه**: المعمارية واضحة (Express + React + Drizzle + PostgreSQL)، التصميم يحترم RTL والعربية، شاشات الإدارة احترافية، نظام المصادقة قائم على الجلسات بكلمات مرور مُمَلَّحة (`bcrypt`)، وهنالك تكامل سليم مع TanStack Query و shadcn/ui.

غير أنّ المراجعة كشفت **ثغرة أمنية حرجة واحدة** يجب إصلاحها قبل أيّ نشر إنتاجي، إضافة إلى **8 أخطاء TypeScript** ستُفشل عملية بناء صارمة، و**عدّة فرص لتحسين الأداء والصلابة**. التفاصيل أدناه مرتّبة بالأولوية.

| الفئة | الحرج | عالٍ | متوسط | منخفض |
|-------|------|------|------|------|
| الأمن | 1 | 4 | 3 | 2 |
| الأداء | 0 | 2 | 2 | 1 |
| الجودة/TypeScript | 0 | 1 (8 أخطاء) | 4 | 3 |
| البنية والصيانة | 0 | 0 | 5 | 4 |
| الوثائق والتوافق | 0 | 1 | 2 | 1 |

**الجاهزية للإنتاج:** ⚠️ **غير جاهز** قبل إصلاح البنود الحرجة في القسم 2.

---

## 2. مشاكل حرجة (يجب إصلاحها فوراً)

### 🚨 ح-1 — كلمة مرور المسؤول الافتراضية مشفّرة في الكود

**الموقع:** `server/storage.ts` السطور 54–55

```ts
const defaultPassword =
  process.env.ADMIN_INITIAL_PASSWORD || "12345678";
```

**المشكلة:**
- إذا نُشِر التطبيق دون ضبط `ADMIN_INITIAL_PASSWORD` (وهو خطأ شائع جداً)، يُنشأ المستخدم `admin` بكلمة المرور `12345678` بشكل صامت.
- هذا يناقض ما يصرّح به `replit.md` و`README.md` صراحة من أنّه "لا توجد كلمات مرور مشفّرة في الكود".
- مكتبات فحص الأسرار (مثل GitHub Secret Scanning أو HoundDog) قد ترفع هذا كاكتشاف عام.
- خطر استيلاء حسابات: أيّ نشر تجريبي يبقى مكشوفاً للعامة.

**الإصلاح المقترح:** إجبار التطبيق على الفشل الصاخب إن لم يُحدَّد المتغيّر، مع شرط طول لا يقلّ عن 8 محارف:

```ts
const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD;
if (!defaultPassword || defaultPassword.length < 8) {
  throw new Error(
    "[STORAGE] متغيّر البيئة ADMIN_INITIAL_PASSWORD مطلوب عند أوّل إقلاع " +
    "ويجب ألّا يقلّ عن 8 محارف. لا توجد كلمة مرور افتراضية."
  );
}
```

> **ملاحظة:** تذكّر بعد الإصلاح حذف عبارة `|| "12345678"` من جميع نسخ المستودع، بما فيها فروع GitHub القديمة إن وُجدت، فالتاريخ يبقى محفوظاً.

---

## 3. مشاكل أمنية عالية الأهمية

### ع-1 — غياب الحماية من القوة الغاشمة على `/api/login`

**الموقع:** `server/auth.ts` (مسار `/api/login`)

لا يوجد `express-rate-limit` ولا أيّ آلية تحديد مُعدّل. يمكن لأيّ مهاجم تجربة آلاف كلمات المرور بالثانية، خاصة أنّ `bcrypt` بطيء ولكنّه ليس حماية كافية بمفرده.

**الإصلاح:**
```ts
import rateLimit from "express-rate-limit";
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10,                  // 10 محاولات لكلّ IP
  message: { message: "تجاوزت عدد محاولات الدخول المسموح. حاول لاحقاً." },
  standardHeaders: true,
});
app.post("/api/login", loginLimiter, /* … */);
```

### ع-2 — لا يوجد `helmet` ولا رؤوس أمان HTTP

لا يضبط `server/index.ts` أيّ رؤوس مثل `Strict-Transport-Security`، `X-Content-Type-Options`، `X-Frame-Options`، أو `Content-Security-Policy`. يكفي إضافة:

```ts
import helmet from "helmet";
app.use(helmet({ contentSecurityPolicy: false })); // عطّل CSP إن سبّب مشاكل مع Vite
```

### ع-3 — لا توجد حماية CSRF رغم استعمال جلسات

النمط المعتمد هو **Cookie + Session** (passport-local)، وهذا يعني أنّ كلّ مسار `POST/PATCH/DELETE` معرّض لـ CSRF عبر طلبات من نطاقات أخرى. الحلول الممكنة:
1. تفعيل `sameSite: "strict"` على الكوكي (موجود `lax` افتراضياً عند `express-session`، يجب التوكيد).
2. إضافة حماية CSRF صريحة (مثل `csrf-csrf` أو رمز CSRF مخصّص).
3. التحقّق من ترويسة `Origin`/`Referer` على الطلبات الكاتبة.

### ع-4 — مسار توليد الـ PDF يفتح خطر SSRF

**الموقع:** `server/routes.ts` (مسار `/api/members/:id/pdf` ~ السطر 440–552)

يستخدم `puppeteer` لفتح URL داخلي عبر الكوكي للمستخدم الحالي:
- منطق هشّ ومُكلِف من ناحية الموارد (يفتح متصفّح كامل لكلّ طلب).
- أيّ تلاعب بـ `id` مع توجيه بمعالج وسيط قد يقود لاستدعاء عناوين داخلية حسّاسة.
- متغيّر `CHROME_PATH` غير محقَّق منه؛ خطأ التشغيل لا يُترجَم لرسالة عربية.

**التوصية:** استبدال `puppeteer` بمولّد PDF خفيف يعمل من البيانات مباشرة (مثل `pdfkit` أو `@react-pdf/renderer`). هذا يقلّل التبعيات وحجم الصورة (Docker) ويزيل خطر SSRF.

---

## 4. مشاكل أمنية متوسّطة ومنخفضة

| # | الموقع | الوصف | الأولوية |
|----|--------|--------|---------|
| م-1 | `server/index.ts` | حدّ حجم الـ JSON غير محدّد بصرامة (راجع وعدّل `express.json({ limit: "1mb" })`). | متوسّط |
| م-2 | `docker-compose.yml` | كلمة مرور `password` و`SESSION_SECRET=your_secure_session_secret` افتراضيّتان. وثّق صراحة أنّ الملف للتطوير فقط، أو عيّن قراءة `.env`. | متوسّط |
| م-3 | `client/src/pages/Members.tsx:385` | `window.location.href = ...` بدلاً من `useLocation()` — يُحدث Reload كاملاً ويفقد حالة React Query. | منخفض |
| م-4 | `Dockerfile` | يثبّت `chromium` بحجم +400MB — اربطه بحاجة فعليّة لمسار PDF أو احذفه عند التحوّل لـ `pdfkit`. | منخفض |

---

## 5. أخطاء TypeScript (نتيجة `tsc --noEmit`)

8 أخطاء ستوقف أيّ بناء يعتمد `tsc` صارم. المشكلة الجذرية: المخطّط في `shared/schema.ts` يسمح بالقيم `null` في حقول مثل `fullName` و`englishName`، لكنّ الواجهة تفترض دائماً وجود قيمة.

| السطر | الخطأ المختصر |
|------|----------------|
| `client/src/pages/Home.tsx:133` | فهرسة كائن قد تكون نتيجتها `null`. |
| `client/src/pages/MemberDetails.tsx:283-284` | تمرير `string \| null` إلى مكوّن يقبل `string` فقط داخل `Paragraph`. |
| `client/src/pages/Members.tsx:69-73` | استدعاء `.toLowerCase()` على `fullName/englishName/phone/email` التي قد تكون `null`. |

**الحلّ المختصر:**
- إمّا تحديث المخطّط ليعكس الواقع: `text("full_name").notNull().default("")`.
- وإمّا إضافة فحوص دفاعية: `(member.fullName ?? "").toLowerCase().includes(query)`.
- يُفضَّل الحلّ الأوّل (سياسة "لا قيم فارغة"). يتطلّب `npm run db:push` للمزامنة.

> **توصية تشغيلية:** أضف `npm run check` كخطوة فحص داخل CI (موجود فعلاً في `.github/workflows/ci.yml`)، وامنع الدمج إلى `main` إذا فشلت.

---

## 6. الأداء

### أ-1 — استعلامات N+1 في قائمة الأعضاء والاشتراكات

**المواقع:**
- `server/routes.ts` ~ السطر 114 (`/api/members`)
- `server/routes.ts` ~ السطر 413 (`/api/backup`)
- مسار استيراد الاشتراكات

النمط الحالي: لكلّ عضو نُجري `getSubscriptionsByMemberId(member.id)` عبر `Promise.all`. مع 1000 عضو يُنفَّذ 1001 استعلام منفصل.

**الإصلاح:** استعلام واحد بـ `JOIN`:
```ts
// داخل storage.ts
const rows = await db
  .select()
  .from(members)
  .leftJoin(subscriptions, eq(subscriptions.memberId, members.id));
// ثمّ تجميع النتيجة في الذاكرة
```
أو استعلامين فقط: واحد للأعضاء، واحد لكلّ الاشتراكات بـ `inArray(subscriptions.memberId, ids)`، ثمّ تجميع في JS.

### أ-2 — `staleTime: Infinity` على مستوى عام

**الموقع:** `client/src/lib/queryClient.ts`

ضبط `staleTime: Infinity` افتراضياً يعني أنّ البيانات لا تتحدّث تلقائياً أبداً، وتعتمد كلّياً على الإبطال اليدوي (`invalidateQueries`). هذا يعمل، لكنّه هشّ — أيّ نسيان لإبطال مفتاح يُنتج بيانات قديمة.

**التوصية:** ضع قيمة معقولة (مثل 30 ثانية) وأبقِ `Infinity` على الاستعلامات النادرة التغيّر فقط.

### أ-3 — `getQueryFn` يكسر مفاتيح التخزين الهرميّة

**الموقع:** `client/src/lib/queryClient.ts`

دالة الـ fetcher الافتراضية تقوم بـ `queryKey.join("/")`، هذا يعني أنّ مفتاحاً مثل `['/api/members', id]` ينتج `/api/members/123` (سليم)، لكن `['/api/members', { filter: 'x' }]` ينتج `/api/members/[object Object]`. اشتُكي من هذا النمط في قاعدة الأسلوب الرسمية لـ TanStack Query.

**الإصلاح:** اعتمد دائماً URL كاملة في العنصر الأوّل من المفتاح، أو اكتب fetcher يَفهم الكائنات.

---

## 7. جودة الكود والصيانة

### ج-1 — ملفّات ضخمة تتجاوز ألف سطر

| الملف | السطور | اقتراح |
|------|------|------|
| `client/src/pages/MemberDetails.tsx` | 900 | فصل: `MemberHero`, `SubscriptionsTable`, `PaymentDialog`, `PdfActions`. |
| `client/src/pages/Settings.tsx` | 769 | فصل تبويبات: `UserManagement`, `MemberImport`, `SubscriptionImport`, `Backup`. |
| `client/src/pages/Members.tsx` | 587 | فصل `MembersFilters`, `MembersTable`, `MemberRow`. |
| `server/routes.ts` | 555 | فصل إلى `routes/members.ts`, `routes/subscriptions.ts`, `routes/admin.ts`. |

### ج-2 — استخدام `fetch` مباشر بدل `apiRequest` في `Settings.tsx`

طلبات إنشاء/تعديل/حذف المستخدمين في `Settings.tsx` تستخدم `fetch` يدوياً وترمي خطأً نصّياً جامداً (`"Failed to create user"`). هذا يضيع رسالة الخطأ القادمة من الخلفية على المستخدم.

**الإصلاح:** استعمال `apiRequest` من `@/lib/queryClient` ليتمكّن `useToast` من إظهار الرسالة الفعليّة (مثل "اسم المستخدم محجوز").

### ج-3 — أنواع `any` متناثرة (14 موقعاً)

أبرزها:
- `editingUser: any` في `Settings.tsx`.
- `useQuery<any[]>` و`useQuery<any>`.
- `obj: Record<string, any>` في معالجات الاستيراد.

**التوصية:** استخدم الأنواع المُصدَّرة من `@shared/schema` (مثل `User`, `Member`, `Subscription`).

### ج-4 — مسار `npm run seed` يشير لملفّ غير موجود

```json
"seed": "tsx server/seed.ts"
```

ولكن `server/seed.ts` غير موجود في المستودع. أيّ من:
- إضافة الملف وتنفيذ منطق إدراج بيانات تجريبية، أو
- حذف السكربت من `package.json` (يتطلّب موافقة المستخدم وفقاً للقواعد).

### ج-5 — `console.log` في كود الإنتاج

موقعان فقط: `server/storage.ts:64` و`server/index.ts:35`. الموقع الثاني هو دالة لوغ مدروسة. الأول يجب تحويله لاستدعاء لوغ موحّد.

### ج-6 — تكرار التحقّق على `params?.id`

في `AddMember.tsx`: تظهر `params?.id` ست مرات. يفضّل استخراجها مرّة واحدة بعد التأكّد:
```ts
if (!isEdit || !params?.id) return;
const id = params.id;
```

---

## 8. البنية المعماريّة

### ب-1 — منطق العمل في `routes.ts` بدلاً من طبقة الخدمة

النمط الحالي: `routes.ts` يحوي تحقّقاً، تحويل بيانات، استعلامات، وتجميعاً. هذا يكسر القاعدة المذكورة في `replit.md` ("الـ routes يجب أن تكون رفيعة"). الأمثلة الأبرز:
- منطق استيراد Excel (تطبيع، تحقّق، تجميع نتائج).
- منطق توليد الـ PDF.
- منطق النسخ الاحتياطي (Backup).

**التوصية:** نقل هذه المنطق إلى `server/services/` (مثلاً `services/import.ts`, `services/backup.ts`, `services/pdf.ts`).

### ب-2 — `MembersContext` متجاوَز

السياق `MembersContext` يحتفظ بنسخة محلّيّة من الأعضاء، وفي الوقت ذاته TanStack Query يحتفظ بالـ cache. هذا تكرار للحالة، وقد يُحدِث عدم اتساق.

**التوصية:** الاعتماد كلياً على TanStack Query وحذف السياق، أو استخدام السياق فقط للوصول السريع (selectors فوق الـ queryClient).

### ب-3 — تنظيم الترجمة

`LanguageContext.tsx` يخزّن جميع المفاتيح في كائن واحد ضخم. مع نموّ التطبيق سيصعب الصيانة.

**التوصية:** نقل الترجمات إلى `client/src/i18n/{ar,en}.ts` وتقسيمها حسب الفضاء (`nav`, `field`, `action`...).

### ب-4 — لا توجد اختبارات مؤتمتة (Zero coverage)

غياب أيّ اختبار وحدوي أو تكاملي. أنصح بـ:
- اختبارات وحدويّة لمنطق `storage.ts` و`services/import.ts` بـ Vitest.
- اختبار سريع e2e لمسار "تسجيل دخول → عرض الأعضاء" بـ Playwright.

---

## 9. الاتساق مع الوثائق

### و-1 — `README.md` يدّعي ما لا يفعله الكود

| المُدَّعى | الواقع |
|---------|--------|
| "لا كلمة مرور مشفّرة في الكود" | يوجد fallback `"12345678"` (راجع البند ح-1). |
| "النظام يستخدم HTTPS عبر Cloudflare Tunnel" (ذُكر سابقاً) | تمّت إزالة Cloudflare من المستودع — الوثيقة محدّثة الآن، فقط أكّد أنّ نسخ التطوير لا تذكره. |

### و-2 — `replit.md` لا يعكس آخر تغييرات GitHub

ملف `replit.md` لا يذكر إضافة `.github/workflows/ci.yml` و`dependabot.yml` ولا حذف `cloudflare_tunnel`. حدِّث القسم "Recent Changes".

---

## 10. الوصوليّة (Accessibility) و RTL

نقاط إيجابية:
- استخدام `dir={direction}` و`me-2`/`ms-2` (logical CSS) متّسق.
- زرّ "تخطّي إلى المحتوى الرئيسي" موجود في `Layout.tsx`.
- `aria-label` متوفّر على معظم الأيقونات.
- `aria-current="page"` على عناصر التنقّل النشطة.

نقاط للتحسين:
- بعض الجداول (`Members.tsx`) تفتقد `<caption>` عربي.
- نقص في `aria-live` للإشعارات الديناميّة (Toaster يتولّاها لكن استيرادات Excel لا).
- التباين اللوني في حالات `print:` يحتاج تدقيقاً (أصفر فاتح على أبيض).

---

## 11. النشر و DevOps

| البند | الوضع | ملاحظة |
|------|-------|--------|
| Workflow CI (`type-check + build`) | ✅ موجود | جيد. أضف `npm test` مستقبلاً. |
| Dependabot | ✅ مُعدّ | جيد. |
| Dockerfile | ⚠️ كبير | يحوي Chromium (~400MB). راجع البند ع-4. |
| docker-compose.yml | ✅ نظيف | تمّت إزالة Cloudflare. وثّق أنّ القيم للتطوير. |
| Migrations | ⚠️ غير مدفوعة | الاعتماد على `db:push` فقط — مناسب للتطوير، خطر في الإنتاج. |
| Logs | ⚠️ stdout فقط | لا توجد دورة سجلات. ضع winston/pino مع تدوير حسب الحاجة. |

---

## 12. خطّة عمل مقترحة (Roadmap)

**أسبوع 1 — أمن إجباري:**
1. إصلاح ح-1 (إزالة كلمة المرور الافتراضية) — _نصف ساعة_.
2. إضافة `helmet` + `express-rate-limit` على `/api/login` — _ساعة_.
3. تشديد ضبط الكوكي (`sameSite: "strict"`, `secure: true` في الإنتاج).

**أسبوع 2 — جودة:**
4. إصلاح أخطاء TypeScript الثمانية (تعديل المخطّط أو المعالجة الدفاعية).
5. تفعيل `npm run check` كحاجز دمج في CI.
6. توحيد كلّ مكالمات الواجهة على `apiRequest` (إلغاء `fetch` المباشر).

**أسبوع 3 — أداء:**
7. إصلاح N+1 على `/api/members` و`/api/backup`.
8. مراجعة `staleTime: Infinity`.

**أسبوع 4 — هيكلة:**
9. تقسيم `MemberDetails.tsx` و`Settings.tsx` إلى مكوّنات أصغر.
10. نقل منطق الأعمال إلى `server/services/`.
11. استبدال `puppeteer` بـ `pdfkit`.

**فيما بعد:**
12. كتابة اختبارات لتغطية المسارات الحرجة (تسجيل الدخول، إنشاء عضو، استيراد Excel).
13. توثيق سياسة النسخ الاحتياطي ومخطّط استرجاع الكوارث.

---

## 13. خلاصة

المشروع **عمل احترافي** يعكس فهماً جيداً للمعمارية الحديثة و RTL، ويستحقّ النشر بعد إصلاح ثغرة `ADMIN_INITIAL_PASSWORD` ومعالجة أخطاء TypeScript الثابتة. باقي الملاحظات هي تحسينات صحيّة على المدى المتوسّط.

**التقدير العامّ:** B+ قبل الإصلاحات، A- بعد إصلاح القسمين 2 و5.

— نهاية التقرير —
