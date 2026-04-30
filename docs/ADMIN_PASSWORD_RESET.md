# Admin Password Reset — دليل إعادة تعيين كلمة سرّ المدير

> Standalone, audit-friendly procedure for safely resetting any user's
> password (typically the `admin` account) when the one-time login banner is
> no longer available.
>
> دليل مستقلّ وآمن لإعادة تعيين كلمة سرّ أيّ مستخدم — وعادةً حساب `admin` —
> عندما لا تعود نقطة الكشف المرّة-الواحدة متاحة.

---

## 1. When to use this — متى تستخدم هذا الإجراء

Use this procedure ONLY in one of the following situations:

استخدم هذا الإجراء **فقط** في إحدى الحالات التالية:

- **Lost initial credentials.** The first-boot banner that prints the auto-generated
  admin password was missed or rotated out of the logs, and `/api/initial-credentials`
  has already been consumed (it returns `404`).

  **فقدان الكلمة الأوّليّة.** فاتك سطر طباعة كلمة المرور الأوّليّة في سجلّ التشغيل،
  أو تدوّر السجلّ بعد إعادة التشغيل، ونقطة `/api/initial-credentials` لم تعد متاحة.

- **Forgotten password for an existing admin or employee account.** No other admin
  is available to reset it through the Settings UI.

  **نسيان كلمة مرور حساب موجود** ولا يوجد مدير آخر يستطيع إعادة تعيينها من واجهة الإعدادات.

- **Onboarding automation.** You want to inject a known temporary password into a
  freshly provisioned environment, then have the user rotate it on first login.

  **أتمتة التهيئة.** تريد ضبط كلمة مؤقّتة معروفة في بيئة جديدة، ثم تُترك للمستخدم لتغييرها عند أوّل دخول.

> **Do NOT use this for routine password changes.** Routine changes go through the
> "Change password" UI after login, or by an admin through the Settings page.
>
> **لا تستخدمه للتغييرات الاعتياديّة.** التغييرات اليوميّة تتمّ من خلال شاشة "تغيير كلمة المرور"
> بعد الدخول، أو من قِبَل مدير عبر صفحة الإعدادات.

---

## 2. What the script does — ماذا يفعل السكربت

`script/reset-admin-password.ts` performs **one** SQL `UPDATE` against a single user
row and nothing else:

ينفّذ الملف `script/reset-admin-password.ts` تحديثاً واحداً (`UPDATE`) على صفّ مستخدم واحد فقط، ولا شيء آخر:

| Column                  | Action                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| `password`              | Set to a fresh `bcrypt` hash (cost = 10) of the new password.          |
| `must_change_password`  | Force-set to `true`, so the user is prompted to rotate on next login.  |

Everything else is preserved — `id`, `username`, `role`, and any related data
(members, subscriptions, ...) are **not** touched.

كلّ ما عدا ذلك يبقى كما هو — `id`، `username`، `role`، وأيّ بيانات مرتبطة (أعضاء، اشتراكات، ...) **لا تُمسّ**.

---

## 3. Safety guarantees — الضمانات الأمنيّة

- **No code path runs the script automatically.** It is invoked manually from a
  shell only.
  **لا يُشغَّل تلقائيّاً مطلقاً.** يُستدعى يدويّاً من سطر الأوامر فقط.

- **No plaintext password is ever written to disk or to a persistent log.**
  Generated passwords appear in the terminal once, then disappear from process memory.
  **لا تُكتب كلمة المرور في أي ملف ولا في أي سجلّ دائم.** الكلمة المُولَّدة تظهر في الطرفيّة مرّة واحدة فقط.

- **Pre-flight existence check.** The script reads the target user first; if no
  matching row exists, it aborts before attempting any write.
  **فحص مسبق للوجود.** السكربت يقرأ المستخدم أوّلاً، وإن لم يوجد، يفشل قبل أيّ كتابة.

- **Atomicity assertion.** The script aborts if the `UPDATE` affected anything other
  than exactly one row.
  **ضمان الذرّيّة.** يفشل إن لم يتأثّر بالتحديث صفّ واحد بالضبط.

- **Forced rotation.** `must_change_password` is always set to `true`. Whatever
  password the script applies is treated as a one-time temporary credential.
  **تدوير إجباري.** خاصيّة `must_change_password` تُضبط دائماً على `true`، فالكلمة تُعامل كمؤقّتة دائماً.

- **Production guard.** When `NODE_ENV=production`, the script refuses to run unless
  `CONFIRM=yes` is also present in the environment.
  **حماية الإنتاج.** في بيئة الإنتاج يرفض السكربت العمل ما لم تُمرَّر `CONFIRM=yes` بشكل صريح.

---

## 4. Prerequisites — المتطلّبات

| Requirement       | Details                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Node.js & deps    | `npm install` already ran in this checkout (the script uses `tsx`, `bcryptjs`, `drizzle-orm`). |
| `DATABASE_URL`    | Must point at the database whose user row you want to update.                                  |
| Shell access      | Direct shell access to the runtime where `DATABASE_URL` is reachable (dev container, Replit Deployment Shell, etc.). |

> **Make sure `DATABASE_URL` targets the right database.** Resetting against the
> wrong environment is the single biggest risk — read the URL twice before running
> in production.
>
> **تأكّد أنّ `DATABASE_URL` يشير إلى قاعدة البيانات الصحيحة.** الخطأ في البيئة هو أكبر خطر في هذا الإجراء.

---

## 5. Usage modes — أوضاع الاستخدام

All commands are run from the **project root**. Replace example values as needed.

كل الأوامر تُنفَّذ من **مجلّد المشروع الجذري**. غيّر القيم حسب الحاجة.

### 5.1 Generate a strong random password for `admin` — توليد كلمة قويّة عشوائيّة لحساب `admin`

```bash
npx tsx script/reset-admin-password.ts
```

The new password (24 characters, URL-safe alphabet, no ambiguous characters) is
printed once inside a highlighted box. **Copy it immediately** — it cannot be
recovered later.

تظهر الكلمة الجديدة (24 حرفاً) داخل إطار مميّز **مرّة واحدة فقط**. انسخها فوراً — لن يمكن استعادتها لاحقاً.

### 5.2 Use a password you choose — استخدام كلمة من اختيارك

Either as a CLI flag:

عبر وسيط سطر الأوامر:

```bash
npx tsx script/reset-admin-password.ts --password='My$tr0ng!Pass'
```

Or — preferred, as it does not appear in shell history — via an environment variable:

أو — وهو الأفضل لأنّه لا يظهر في تاريخ الـShell — عبر متغيّر بيئة:

```bash
ADMIN_RESET_PASSWORD='My$tr0ng!Pass' npx tsx script/reset-admin-password.ts
```

The chosen password must be **at least 8 characters**. The script never echoes it
back; it only confirms that the supplied value was applied.

يجب أن لا تقلّ الكلمة عن **8 أحرف**. السكربت لا يعيد طباعتها — يكتفي بتأكيد أنّ القيمة المُمرَّرة طُبِّقت.

### 5.3 Target a user other than `admin` — استهداف مستخدم آخر

```bash
npx tsx script/reset-admin-password.ts --user=other_admin
```

Combine with any of the password modes above:

يمكن دمجها مع أيّ وضع من أوضاع كلمة المرور أعلاه:

```bash
ADMIN_RESET_PASSWORD='Temp!Pass2026' \
  npx tsx script/reset-admin-password.ts --user=jane
```

### 5.4 Help / المساعدة

```bash
npx tsx script/reset-admin-password.ts --help
```

---

## 6. Running in production (Replit Deployment) — التشغيل على الإنتاج في Replit

1. Open your Replit deployment and start its **Shell** (the deployment shell, not
   the dev workspace shell — only the deployment shell sees the production
   `DATABASE_URL`).

   افتح نشر التطبيق في Replit وابدأ **Shell** الخاصّة بالنشر (وليس Shell بيئة التطوير) — هذه فقط هي التي ترى `DATABASE_URL` الإنتاجي.

2. Confirm you are on the right database:

   تأكّد أنّك على قاعدة البيانات الصحيحة:

   ```bash
   echo "$DATABASE_URL" | sed 's|//[^@]*@|//<redacted>@|'
   ```

3. Run with the production guard:

   نفّذ مع حماية الإنتاج:

   ```bash
   CONFIRM=yes NODE_ENV=production \
     npx tsx script/reset-admin-password.ts
   ```

4. Copy the printed temporary password, then immediately log in to the production
   site as `admin`. The app will force you to set a new password before doing
   anything else.

   انسخ الكلمة المؤقّتة المطبوعة، ثم سجّل الدخول مباشرةً كـ`admin`. سيُجبرك التطبيق على وضع كلمة جديدة قبل أيّ إجراء آخر.

5. **Recommended:** rotate the password again from the UI after you are in. Do not
   leave the temporary value in place.

   **يُستحسن:** أن تغيّر الكلمة مرّة أخرى من واجهة التطبيق بعد الدخول؛ لا تترك القيمة المؤقّتة في الاستخدام.

---

## 7. Expected output — الإخراج المتوقّع

On success the script prints a clearly delimited box:

عند النجاح يطبع السكربت إطاراً واضحاً:

```
╔══════════════════════════════════════════════════════════════╗
║  Password reset successful                                   ║
║  تم إعادة تعيين كلمة المرور بنجاح                              ║
╠══════════════════════════════════════════════════════════════╣
║  username: admin                                             ║
║  role:     admin                                             ║
║  password: <fresh value>                                     ║
╠══════════════════════════════════════════════════════════════╣
║  • Copy the password NOW — it will not be shown again.       ║
║  • The user MUST change this password on their next login.   ║
╚══════════════════════════════════════════════════════════════╝
```

If you supplied your own password, the line `password:` reads
`(the value you supplied was applied)` instead of echoing the secret.

إذا مرّرت كلمتك الخاصّة، فإنّ سطر `password:` يكتفي بعبارة "(القيمة التي زوّدتها قد طُبِّقت)" دون ترديد السرّ.

---

## 8. Troubleshooting — معالجة المشكلات

| Message                                              | Meaning / المعنى                                                                           | Fix / الحلّ                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `DATABASE_URL is not set.`                           | The env var is missing in the current shell.                                               | Open a shell that already has the variable set (e.g. Replit Deployment Shell), or export it manually. |
| `Refusing to run in production without confirmation.`| `NODE_ENV=production` was detected without `CONFIRM=yes`.                                  | Re-run with `CONFIRM=yes NODE_ENV=production ...` once you are sure.       |
| `User "<name>" was not found.`                       | No row in `users` matches the supplied `--user`.                                           | Check spelling, or list users via the Settings page first.                 |
| `Provided password must be at least 8 characters.`   | The value passed via `--password` / `ADMIN_RESET_PASSWORD` is too short.                   | Choose a longer value or omit the flag to auto-generate one.               |
| `Update did not affect exactly one row (rows=...)`.  | A safety guard tripped — the `UPDATE` matched zero or more than one row.                   | Investigate the `users` table directly. Do not retry blindly.              |

---

## 9. Audit log recommendation — توصية بالتدوين

This script is intentionally not networked, but in production environments you
should keep your own out-of-band record:

السكربت لا يتواصل مع أي خدمة خارجيّة، ولكن في الإنتاج يُستحسَن أن تحتفظ بسجلّ يدوي:

- Who ran it / من نفّذه
- When (timestamp) / متى (الوقت بدقّة)
- Which user was reset / أيّ حساب أُعيد تعيينه
- Reason / السبب
- Confirmation that the temporary password was rotated by the end user / تأكيد أنّ المستخدم النهائي غيّر الكلمة المؤقّتة

---

## 10. Related — ملفّات ذات صلة

- `server/storage.ts` — `initializeAdmin()` is the original mechanism that creates
  the `admin` user on a fresh database and prints the one-time banner.
  هذا هو المنطق الأصلي الذي ينشئ `admin` على قاعدة بيانات جديدة ويطبع الإطار المرّة-الواحدة.
- `server/routes.ts` — exposes `GET /api/initial-credentials` which reveals the
  freshly generated password to the very first browser session, then permanently
  clears it.
  هي النقطة التي تكشف الكلمة الأوّليّة لأوّل جلسة متصفّح، ثمّ تُمسحها نهائيّاً.
- `docs/SECURITY.md` — broader security posture for the project.
  السياسة الأمنيّة الشاملة للمشروع.
