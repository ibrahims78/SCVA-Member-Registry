<div align="center">

# نظام إدارة الأعضاء — الرابطة السورية لأمراض وجراحة القلب
### SCVA Members Management System

نظام احترافي ثنائي اللغة (عربي / إنجليزي) لإدارة قاعدة بيانات أعضاء جمعية طبية، يدعم سجلّ الاشتراكات السنوية، تصدير التقارير، وإدارة الصلاحيات.

A bilingual (Arabic / English) full-stack member management platform for a medical association — with annual subscription tracking, report exports, and role-based access.

[![Made with TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 جدول المحتويات / Table of Contents

- [الميزات / Features](#-الميزات--features)
- [المعمارية التقنية / Tech Stack](#-المعمارية-التقنية--tech-stack)
- [بنية المشروع / Project Structure](#-بنية-المشروع--project-structure)
- [البدء السريع / Quick Start](#-البدء-السريع--quick-start)
- [متغيرات البيئة / Environment Variables](#-متغيرات-البيئة--environment-variables)
- [الأوامر المتاحة / Available Scripts](#-الأوامر-المتاحة--available-scripts)
- [قاعدة البيانات / Database](#-قاعدة-البيانات--database)
- [النشر / Deployment](#-النشر--deployment)
- [الأمان / Security](#-الأمان--security)
- [المساهمة / Contributing](#-المساهمة--contributing)
- [الترخيص / License](#-الترخيص--license)

---

## ✨ الميزات / Features

| 🇸🇦 العربية | 🇬🇧 English |
|---|---|
| لوحة تحكّم تفاعلية مع إحصائيات وأنواع العضوية | Interactive dashboard with stats & charts |
| إدارة كاملة للأعضاء (إضافة / تعديل / حذف / بحث) | Full members CRUD with search & filters |
| تصفّح مع ترقيم (10/25/50/100 سجل في الصفحة) | Pagination (10/25/50/100 rows per page) |
| سجلّ اشتراكات سنوي قابل للإضافة والتعديل والحذف | Annual subscription log (add/edit/delete) |
| استيراد جماعي ذكي من Excel مع وضع التحديث | Smart Excel bulk import with update mode |
| تصدير إلى Excel و Word و PDF بدعم كامل للعربية | Excel / Word / PDF export with Arabic shaping |
| دعم RTL كامل وثنائي اللغة (عربي / إنجليزي) | Full RTL & i18n support (AR / EN) |
| المظهر الفاتح والداكن (Light / Dark) | Light & Dark mode |
| مصادقة آمنة بالـ Sessions + bcrypt | Secure Session-based auth + bcrypt |
| صلاحيات بدور: مسؤول / موظف | Role-based access: admin / employee |
| إجبار تغيير كلمة مرور المسؤول عند أوّل دخول | Forced password change on first admin login |

---

## 🧱 المعمارية التقنية / Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Wouter** للتوجيه (lightweight router)
- **shadcn/ui** على Radix UI primitives
- **Tailwind CSS v4** + متغيرات CSS + الوضع الداكن
- **TanStack Query v5** لإدارة حالة الخادم
- **React Hook Form** + **Zod** للتحقق من النماذج
- **Recharts** للرسوم البيانية، **xlsx** و **docx** للتصدير

### Backend
- **Express 5** + **TypeScript**
- **Passport (Local Strategy)** + **bcryptjs** للمصادقة
- **connect-pg-simple** لتخزين الجلسات في PostgreSQL
- **Drizzle ORM** + **node-postgres** للوصول لقاعدة البيانات
- **Zod** للتحقق من جميع طلبات الكتابة
- **Puppeteer / Chromium** لتوليد ملفات PDF

### Database
- **PostgreSQL 15+**
- جداول: `users`, `members`, `subscriptions`, `session`

---

## 📁 بنية المشروع / Project Structure

```
.
├── client/                  # تطبيق الواجهة الأمامية React
│   ├── src/
│   │   ├── pages/           # صفحات التطبيق (Members, Home, Settings, ...)
│   │   ├── components/ui/   # مكونات shadcn/ui
│   │   ├── context/         # MembersContext, LanguageContext, ...
│   │   ├── hooks/           # use-toast, ...
│   │   └── lib/             # queryClient, utils, ...
│   └── index.html
│
├── server/                  # واجهة Express الخلفية
│   ├── index.ts             # نقطة الدخول
│   ├── routes.ts            # جميع مسارات الـ API
│   ├── storage.ts           # طبقة الوصول للبيانات (IStorage)
│   ├── auth.ts              # إعداد Passport
│   ├── seed.ts              # سكربت زرع البيانات الأوّلية
│   └── vite.ts              # تهيئة Vite في وضع التطوير
│
├── shared/
│   └── schema.ts            # مخطط Drizzle + Zod (مشترك بين العميل والخادم)
│
├── docs/                    # توثيق إضافي ولقطات شاشة
├── script/                  # سكربتات البناء
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 البدء السريع / Quick Start

### المتطلبات / Prerequisites
- **Node.js 20+**
- **PostgreSQL 15+** (محلي أو Cloud — Neon / Supabase / Railway)
- **Chromium** (اختياري، فقط لتصدير PDF من جانب الخادم)

### 1) استنساخ المستودع / Clone

```bash
git clone https://github.com/<your-username>/scva-members.git
cd scva-members
```

### 2) تثبيت الاعتمادات / Install dependencies

```bash
npm install
```

### 3) إعداد متغيرات البيئة / Configure env

```bash
cp .env.example .env
# عدّل القيم في ملف .env بما يناسب بيئتك
```

### 4) إنشاء جداول قاعدة البيانات / Push DB schema

```bash
npm run db:push
```

### 5) تشغيل بيئة التطوير / Run dev server

```bash
npm run dev
```

افتح المتصفّح على: **http://localhost:5000**

> 🔐 عند أوّل تشغيل سيُنشأ حساب المسؤول الافتراضي `admin` بكلمة المرور المعرّفة في `ADMIN_INITIAL_PASSWORD`، وسيُطلب منك تغييرها فور تسجيل الدخول.

---

## 🔐 متغيرات البيئة / Environment Variables

| المتغيّر / Variable | إلزامي / Required | الوصف / Description |
|---|---|---|
| `DATABASE_URL` | ✅ Always | سلسلة اتصال PostgreSQL |
| `SESSION_SECRET` | ✅ Production | مفتاح توقيع جلسات الكوكيز (32+ بايت عشوائياً) |
| `ADMIN_INITIAL_PASSWORD` | ⚠️ First boot | كلمة مرور المسؤول الافتراضي (≥ 8 أحرف) — تُستخدم مرّة واحدة فقط |
| `CHROME_PATH` | ⛔ Optional | مسار Chromium لتصدير PDF (افتراضي: `/usr/bin/chromium`) |
| `PORT` | ⛔ Optional | منفذ الخادم (افتراضي: `5000`) |
| `NODE_ENV` | ⛔ Optional | `development` أو `production` |

> 💡 لتوليد `SESSION_SECRET` آمن:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## 📜 الأوامر المتاحة / Available Scripts

| الأمر / Script | الوظيفة / Purpose |
|---|---|
| `npm run dev` | تشغيل خادم التطوير (Express + Vite middleware) على المنفذ 5000 |
| `npm run build` | بناء حزمة الإنتاج إلى `dist/` |
| `npm start` | تشغيل تطبيق الإنتاج بعد البناء |
| `npm run check` | فحص أنواع TypeScript |
| `npm run db:push` | مزامنة مخطط Drizzle مع PostgreSQL |
| `npm run seed` | زرع بيانات تجريبية |

---

## 🗄️ قاعدة البيانات / Database

النظام يستخدم **Drizzle ORM**. جميع تعديلات المخطط تتم في `shared/schema.ts` ثم تُطبَّق بـ:

```bash
npm run db:push
```

### الجداول الرئيسية

- **`users`** — مستخدمو النظام (admin / employee)
- **`members`** — بيانات الأعضاء (الاسم، الاختصاص، نوع العضوية، ...)
- **`subscriptions`** — سجلّ الاشتراكات السنوية لكل عضو
- **`session`** — جلسات Express (تُنشأ تلقائياً)

### استيراد جماعي من Excel
يدعم النظام رفع ملفات `.xlsx` للأعضاء والاشتراكات من صفحة الإعدادات، مع وضع **«تحديث القيود الموجودة»** لمنع التكرار وتطبيق التغييرات بأمان.

---

## 🚢 النشر / Deployment

### الخيار 1: Replit Deployments (موصى به)
المشروع مُهيّأ مسبقاً لنشر **Autoscale**:
- Build: `npm run build`
- Run: `node ./dist/index.cjs`
- Port: `5000`

### الخيار 2: Docker
```bash
docker compose up --build
```
> ⚠️ **قبل الدفع للمستودع**: راجع `docker-compose.yml` وأزل أي توكنات / أسرار مكشوفة، وانقلها إلى ملف `.env` غير مُتعقَّب.

### الخيار 3: VPS تقليدي
```bash
npm install --production=false
npm run build
NODE_ENV=production npm start
```
استخدم **PM2** أو **systemd** لإبقاء العملية حيّة، وضع **Nginx** كـ reverse proxy أمامها.

### الخيار 4: منصّات سحابيّة
متوافق مع: **Railway**، **Render**، **Fly.io**، **Vercel** (للواجهة الأمامية فقط مع backend منفصل).

---

## 🛡️ الأمان / Security

- ✅ كل مسارات `/api/*` (عدا `/api/login` و `/api/user`) تتطلب جلسة مصادَقة.
- ✅ كل عمليات `/api/users*` والإدارة تتطلب صلاحية `admin`.
- ✅ كلمات المرور مُجزَّأة بـ **bcrypt** (10 rounds).
- ✅ كوكي الجلسة `httpOnly`, `sameSite: lax`, و `secure` في الإنتاج.
- ✅ لا توجد كلمة مرور افتراضية مُضمَّنة في الكود — يجب ضبط `ADMIN_INITIAL_PASSWORD`.
- ✅ تنظيف حقل `password` من جميع استجابات API والسجلات (logs).
- ✅ تحقق Zod على جميع طلبات الكتابة.

> إذا اكتشفت ثغرة أمنية، يرجى عدم فتح Issue عام — أرسل بريداً مباشراً للمشرف.

---

## 🤝 المساهمة / Contributing

نرحّب بالمساهمات! الرجاء اتباع الخطوات التالية:

1. اعمل **Fork** للمستودع.
2. أنشئ فرعاً جديداً: `git checkout -b feat/my-feature`.
3. التزم بالتغييرات: `git commit -m "feat: add my feature"` (نتّبع [Conventional Commits](https://www.conventionalcommits.org/)).
4. ادفع الفرع: `git push origin feat/my-feature`.
5. افتح **Pull Request** مع وصف واضح للتغييرات.

### معايير الكود
- TypeScript strict mode
- اتباع نمط الكود الموجود (Prettier-compatible)
- إضافة `data-testid` لكل عنصر تفاعلي جديد
- التأكد من نجاح `npm run check` قبل الدفع

---

## 📄 الترخيص / License

هذا المشروع مرخّص بموجب **MIT License** — راجع ملف [LICENSE](LICENSE) للتفاصيل.

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

صُنع بعناية للرابطة السورية لأمراض وجراحة القلب 🫀<br>
Built with care for the Syrian Cardiovascular Association

</div>
