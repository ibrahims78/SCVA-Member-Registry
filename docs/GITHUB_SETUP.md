# 🚀 دليل الإعداد الاحترافي لمستودع GitHub
## Professional GitHub Repository Setup Guide

> دليل خطوة بخطوة لتحويل مستودعك إلى مشروع مفتوح المصدر احترافي.
> A step-by-step guide to turn your repository into a professional open-source project.

---

## 📑 جدول المحتويات

- [المرحلة 0: قبل الدفع — تنظيف الأسرار](#المرحلة-0-قبل-الدفع--تنظيف-الأسرار-)
- [المرحلة 1: إنشاء المستودع ورفع الكود](#المرحلة-1-إنشاء-المستودع-ورفع-الكود)
- [المرحلة 2: إعدادات General](#المرحلة-2-إعدادات-general)
- [المرحلة 3: حماية الفروع (Branch Protection)](#المرحلة-3-حماية-الفروع-branch-protection)
- [المرحلة 4: الأمان (Code Security)](#المرحلة-4-الأمان-code-security)
- [المرحلة 5: الأسرار والمتغيرات (Secrets & Variables)](#المرحلة-5-الأسرار-والمتغيرات-secrets--variables)
- [المرحلة 6: تفعيل GitHub Actions](#المرحلة-6-تفعيل-github-actions)
- [المرحلة 7: Discussions و Wiki و Projects](#المرحلة-7-discussions-و-wiki-و-projects)
- [المرحلة 8: تحسين المظهر العام](#المرحلة-8-تحسين-المظهر-العام)
- [المرحلة 9: النشر التلقائي (CD)](#المرحلة-9-النشر-التلقائي-cd)
- [المرحلة 10: Releases و Versioning](#المرحلة-10-releases-و-versioning)
- [المرحلة 11: المتابعة الدورية](#المرحلة-11-المتابعة-الدورية)
- [قائمة تحقّق نهائية](#-قائمة-تحقّق-نهائية)

---

## المرحلة 0: قبل الدفع — تنظيف الأسرار 🚨

### ⚠️ خطوة حرجة قبل أي push
لا تدفع كوداً يحتوي على توكنات أو أسرار. تحقّق:

```bash
# ابحث عن أنماط مشبوهة قبل الدفع
grep -rE "(token|secret|password|api[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9]{20,}" \
  --exclude-dir=node_modules --exclude-dir=.git .
```

### تأكّد من `.gitignore`
يجب أن يحتوي على:
```
.env
.env.local
node_modules/
dist/
.DS_Store
```
✅ تمّ إعداده بالفعل في هذا المشروع.

---

## المرحلة 1: إنشاء المستودع ورفع الكود

### 1.1 أنشئ المستودع على GitHub
- اذهب إلى: https://github.com/new
- **Repository name**: `scva-members` (أو ما تختاره)
- **Description**: مأخوذ من README — مثلاً:
  > "Bilingual (AR/EN) member management system for the Syrian Cardiovascular Association — full-stack TypeScript with PostgreSQL"
- **Visibility**: Public (للمشروع المفتوح) أو Private
- ⚠️ **لا تختر** "Initialize with README/LICENSE/.gitignore" — لديك هذه الملفات بالفعل.

### 1.2 ادفع الكود محلياً

```bash
# داخل مجلّد المشروع
git init
git add .
git commit -m "chore: initial public release"
git branch -M main
git remote add origin https://github.com/<USERNAME>/scva-members.git
git push -u origin main
```

> 💡 لو سبق وعملت commits على فرع آخر، استخدم: `git branch -m old-name main`.

---

## المرحلة 2: إعدادات General

اذهب إلى: **Settings → General**

### 2.1 Repository details
| الحقل | القيمة |
|---|---|
| **Description** | الوصف من README (سطر واحد) |
| **Website** | رابط النشر (مثلاً `https://scva.replit.app`) |
| **Topics** | اضغط ⚙️ بجوار "About" وأضف: `typescript`, `react`, `react-19`, `express`, `postgresql`, `drizzle-orm`, `tailwindcss`, `shadcn-ui`, `arabic`, `rtl`, `i18n`, `members-management`, `medical`, `vite`, `passport-js` |

### 2.2 Features
- ✅ **Issues** — ضروري لتلقّي البلاغات
- ✅ **Discussions** — للنقاشات والأسئلة
- ✅ **Projects** — لتنظيم الـ Roadmap
- ❌ **Wiki** — عطّله ما لم تستخدمه (الـ docs في المستودع كافية)
- ❌ **Sponsorships** — حسب الحاجة

### 2.3 Pull Requests
- ✅ Allow **squash merging** (موصى به — يبقي تاريخ `main` نظيفاً)
- ❌ Allow merge commits (عطّله)
- ❌ Allow rebase merging (عطّله)
- ✅ **Always suggest updating pull request branches**
- ✅ **Automatically delete head branches**
- ✅ **Allow auto-merge**

### 2.4 Archives
- ✅ **Include Git LFS objects in archives**

---

## المرحلة 3: حماية الفروع (Branch Protection)

اذهب إلى: **Settings → Branches → Add branch ruleset**

### 3.1 Ruleset لفرع main
- **Ruleset Name**: `main-protection`
- **Enforcement status**: Active
- **Target branches**: Include `main`

### 3.2 Rules to apply
- ✅ **Restrict deletions**
- ✅ **Require linear history**
- ✅ **Require a pull request before merging**
  - Required approvals: **1** (أو أكثر للفرق الكبيرة)
  - ✅ Dismiss stale reviews when new commits are pushed
  - ✅ Require review from Code Owners (إن أنشأت `CODEOWNERS`)
  - ✅ Require conversation resolution before merging
- ✅ **Require status checks to pass**
  - ✅ Require branches to be up to date
  - أضف check: `Type-check & Build` (سيظهر بعد أوّل تشغيل لـ CI)
- ✅ **Block force pushes**

### 3.3 (اختياري) قاعدة لـ tags
- منع حذف tags بعد إصدار الـ Releases

---

## المرحلة 4: الأمان (Code Security)

اذهب إلى: **Settings → Code security**

### 4.1 Vulnerability reporting
- ✅ **Private vulnerability reporting** — يسمح للباحثين بإبلاغك سرّياً
- ✅ **Dependency graph** (مفعَّل افتراضياً)

### 4.2 Dependabot
- ✅ **Dependabot alerts** — تنبيهات الثغرات
- ✅ **Dependabot security updates** — PRs تلقائية للإصلاحات الأمنية
- ✅ **Dependabot version updates** — مفعَّل عبر الملف `.github/dependabot.yml` (موجود لديك)
- ✅ **Grouped security updates**

### 4.3 Code scanning
- اضغط **Set up** على **CodeQL analysis** → اختر **Default**
  - يفحص الكود تلقائياً عن ثغرات شائعة (XSS, injection, ...)

### 4.4 Secret scanning
- ✅ **Secret scanning**
- ✅ **Push protection** — يمنع دفع توكنات بالخطأ قبل وصولها للمستودع
- ✅ **Validity checks** — يتحقّق إن كان السرّ المُكتشَف لا يزال صالحاً
- ✅ **Non-provider patterns** — يكتشف أنماط أسرار عامّة (UUIDs، JWTs، ...)

---

## المرحلة 5: الأسرار والمتغيرات (Secrets & Variables)

اذهب إلى: **Settings → Secrets and variables → Actions**

### 5.1 Repository secrets (للـ CI/CD)
| Secret | متى يُضاف؟ |
|---|---|
| `DATABASE_URL` | إذا كان CI يحتاج لاتّصال DB حقيقي للاختبارات |
| `SESSION_SECRET` | للنشر التلقائي |
| `DEPLOY_TOKEN` | للنشر على Replit/Railway/Render |
| `CODECOV_TOKEN` | إن استخدمت Codecov |

### 5.2 Environments (للنشر)
أنشئ **Environment** اسمه `production`:
- ✅ Required reviewers (موافقة قبل النشر)
- ✅ Wait timer (مهلة قبل النشر)
- أضف الـ secrets الخاصّة بالإنتاج هنا (وليس على مستوى المستودع)

---

## المرحلة 6: تفعيل GitHub Actions

اذهب إلى: **Settings → Actions → General**

### 6.1 Permissions
- **Actions permissions**: Allow all actions and reusable workflows
- **Workflow permissions**:
  - 🔘 Read and write permissions (لو CI يحتاج push tags)
  - أو Read repository contents (الأكثر أماناً)
- ✅ **Allow GitHub Actions to create and approve pull requests**

### 6.2 تأكّد أن الـ workflow يعمل
بعد أوّل push، اذهب لتبويب **Actions** وتأكّد من نجاح **CI** workflow.
ثمّ ارجع لـ **Branch Protection** وأضف `Type-check & Build` كـ required check.

---

## المرحلة 7: Discussions و Wiki و Projects

### 7.1 تفعيل Discussions
- **Settings → General → Features → Discussions** ✅
- اذهب لتبويب **Discussions** → اختر الفئات الأساسية:
  - 📣 Announcements
  - 💡 Ideas
  - ❓ Q&A
  - 🙏 Show and tell

### 7.2 إنشاء Project (Roadmap)
- اذهب لتبويب **Projects → New project → Board** أو **Roadmap**
- اربطه بالمستودع
- أنشئ أعمدة: `Backlog`, `In Progress`, `Review`, `Done`

---

## المرحلة 8: تحسين المظهر العام

### 8.1 Social Preview Image
- **Settings → General → Social preview**
- ارفع صورة بمقاس **1280×640** تظهر عند مشاركة الرابط على تويتر/لينكد-إن.
- يمكن تصميمها على [Canva](https://canva.com) أو استخدام Figma.

### 8.2 Profile README pinning
- ثبّت المستودع على ملفّك الشخصي: GitHub Profile → Customize your pins.

### 8.3 README badges
الـ README يحتوي بالفعل على badges. أضف أيضاً (بعد إعداد CI):
```markdown
[![CI](https://github.com/<USER>/scva-members/actions/workflows/ci.yml/badge.svg)](https://github.com/<USER>/scva-members/actions/workflows/ci.yml)
[![CodeQL](https://github.com/<USER>/scva-members/actions/workflows/codeql.yml/badge.svg)](https://github.com/<USER>/scva-members/actions/workflows/codeql.yml)
```

### 8.4 (اختياري) ملف CODEOWNERS
أنشئ `.github/CODEOWNERS`:
```
# Default reviewer for everything
*       @your-github-username

# Backend
/server/    @backend-lead
/shared/    @backend-lead

# Frontend
/client/    @frontend-lead

# Docs
*.md        @docs-team
```

---

## المرحلة 9: النشر التلقائي (CD)

### الخيار أ: Replit
1. اربط حساب GitHub بـ Replit.
2. **Import from GitHub** → اختر المستودع.
3. فعّل **Auto-deploy on push to main**.

### الخيار ب: Railway
1. https://railway.app → New Project → Deploy from GitHub repo.
2. أضف خدمة **PostgreSQL** من نفس المشروع.
3. ضع متغيّرات البيئة من `.env.example`.
4. النشر يعمل تلقائياً عند كلّ push.

### الخيار ج: Render
1. https://render.com → New Web Service → Connect repo.
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. أضف PostgreSQL Service وأرسل `DATABASE_URL` كمتغيّر بيئة.

### الخيار د: GitHub Actions → VPS
أنشئ `.github/workflows/deploy.yml` مع `appleboy/ssh-action` لنشر تلقائي عبر SSH.

---

## المرحلة 10: Releases و Versioning

### 10.1 اتباع SemVer
- **MAJOR.MINOR.PATCH** (مثل `1.2.3`)
- MAJOR: تغيير كاسر
- MINOR: ميزة متوافقة
- PATCH: إصلاح خطأ

### 10.2 إصدار release جديد
```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```
ثمّ من تبويب **Releases → Draft new release**:
- اختر الـ tag
- اكتب release notes (اضغط **Generate release notes** للإنشاء التلقائي)
- ✅ Set as latest release

### 10.3 (اختياري) Release-please
أتمتة كاملة لـ Releases عبر [release-please-action](https://github.com/google-github-actions/release-please-action) — ينشئ PRs تلقائياً عند تجمّع تغييرات.

---

## المرحلة 11: المتابعة الدورية

### أسبوعياً
- 🔍 راجع Dependabot PRs ودمج التحديثات الأمنية.
- 💬 ردّ على Issues و Discussions الجديدة.

### شهرياً
- 📊 راجع Insights → Dependency graph.
- 🧹 أغلق Issues القديمة غير الفعّالة (`stale`).
- 📈 راجع Insights → Traffic لمعرفة مَن يستخدم المستودع.

### كلّ ربع سنة
- 🚀 أصدر Release جديد مع CHANGELOG.
- 🔄 راجع وأحدّث `README.md` و `CONTRIBUTING.md`.
- 🛡️ راجع تنبيهات الأمان وعالج المتأخر منها.

---

## ✅ قائمة تحقّق نهائية

### قبل الدفع الأول
- [ ] جميع الأسرار والتوكنات مُزالة من الكود
- [ ] `.gitignore` يستثني `.env` و `node_modules`
- [ ] `LICENSE` موجود في الجذر
- [ ] `README.md` احترافي ومكتمل
- [ ] `.env.example` موجود ومحدَّث

### بعد إنشاء المستودع
- [ ] Description, Website, Topics معبّأة
- [ ] Branch protection على `main`
- [ ] Dependabot مفعَّل (alerts + security updates + version updates)
- [ ] Secret scanning + Push protection مفعَّلان
- [ ] CodeQL مفعَّل
- [ ] Private vulnerability reporting مفعَّل
- [ ] CI workflow ينجح
- [ ] Issues templates و PR template تظهر بشكل صحيح
- [ ] Discussions مفعَّل
- [ ] Social preview image مرفوعة
- [ ] CODEOWNERS موجود (إن كان فريقاً)
- [ ] أوّل Release (v1.0.0) صادر

### علامات الجودة (Community Standards)
اذهب لـ **Insights → Community Standards** وتأكّد أن جميع البنود ✅:
- [ ] Description
- [ ] README
- [ ] Code of conduct
- [ ] Contributing
- [ ] License
- [ ] Security policy
- [ ] Issue templates
- [ ] Pull request template

عند اكتمال كلّ البنود، يحصل المستودع على شارة **100% Community Standards**.

---

## 🎓 موارد إضافية / Additional Resources

- [GitHub Docs — Building a strong community](https://docs.github.com/en/communities)
- [Open Source Guides](https://opensource.guide/)
- [Choose a License](https://choosealicense.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

<div align="center">

🌟 **مبروك!** المستودع الآن احترافي بالكامل وجاهز لاستقبال المساهمين.

🌟 **Congratulations!** Your repository is now fully professional and ready for contributors.

</div>
