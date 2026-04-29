# سياسة الأمان / Security Policy

## النسخ المدعومة / Supported Versions

نقدّم تحديثات أمنية للنسخة الأحدث على فرع `main` فقط.

We provide security updates for the latest version on the `main` branch only.

| النسخة / Version | مدعومة / Supported |
|---|---|
| النسخة الأخيرة / Latest | ✅ |
| الأقدم / Older | ❌ |

---

## 🔐 الإبلاغ عن ثغرة / Reporting a Vulnerability

إذا اكتشفتَ ثغرة أمنية، **يرجى عدم فتحها كـ GitHub Issue عام**. بدلاً من ذلك:

If you discover a security vulnerability, **please do not open a public GitHub issue**. Instead:

### الطريقة المُفضّلة / Preferred method
استخدم خاصية **Private Vulnerability Reporting** في GitHub:
1. اذهب إلى تبويب **Security** في المستودع.
2. اضغط **Report a vulnerability**.
3. املأ التفاصيل بصدق ودقّة.

### الطريقة البديلة / Alternative
أرسل بريداً إلكترونياً إلى المشرف على المشروع (يُحدَّد لاحقاً) مع:
- وصف مفصّل للثغرة
- خطوات إعادة الإنتاج (steps to reproduce)
- التأثير المحتمل (impact)
- اقتراح إصلاح إن وُجد

---

## ⏱️ ما الذي يمكن توقّعه / What to Expect

| المرحلة | المهلة |
|---|---|
| تأكيد استلام البلاغ | خلال **48 ساعة** |
| تقييم أولي وتصنيف الخطورة | خلال **5 أيام عمل** |
| إصدار إصلاح للثغرات الحرجة | خلال **14 يوماً** |
| إفصاح عام منسَّق (CVE إن لزم) | بعد إصدار الإصلاح |

نلتزم بالتواصل الشفّاف معك في كل مرحلة.

---

## 🛡️ نطاق العمل / Scope

تنطبق هذه السياسة على:
- ✅ كود المستودع الرئيسي (server, client, shared).
- ✅ الاعتمادات (dependencies) المباشرة.

**خارج النطاق:**
- ❌ ثغرات في خدمات سحابية تابعة لطرف ثالث (PostgreSQL، استضافة، ...) — أبلغ المزوّد مباشرة.
- ❌ هجمات الهندسة الاجتماعية على المستخدمين.
- ❌ هجمات DoS التطوعية.

---

## 🏆 شكر وتقدير / Acknowledgements

نُقدّر المساهمين الذين يبلّغون عن ثغرات بشكل مسؤول، وسنذكرهم في قسم الشكر بعد إصلاح الثغرة (مع الإذن).

We appreciate responsible disclosure and will credit reporters in our acknowledgements (with permission) after a fix is released.

---

## 🔒 ممارسات الأمان في المشروع / Security Practices

- جميع كلمات المرور مُجزَّأة بـ bcrypt (10 rounds).
- لا توجد كلمات مرور افتراضية مُضمَّنة في الكود.
- جميع الجلسات `httpOnly`, `sameSite=lax`, و `secure` في الإنتاج.
- تنظيف حقل `password` من السجلات والاستجابات.
- تحقق Zod على جميع طلبات الكتابة.
- Dependabot مفعَّل لمراقبة ثغرات الاعتمادات.
- Secret Scanning مفعَّل لمنع تسريب الأسرار في الـ commits.
