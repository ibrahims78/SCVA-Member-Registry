import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & General
  'app.title': { ar: 'رابطة القلبية', en: 'SCVA Members' },
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.members': { ar: 'الأعضاء', en: 'Members' },
  'nav.add_member': { ar: 'إضافة عضو', en: 'Add Member' },
  'nav.reports': { ar: 'التقارير', en: 'Reports' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
  'nav.open_menu': { ar: 'فتح القائمة', en: 'Open menu' },
  'nav.collapse_sidebar': { ar: 'طيّ القائمة', en: 'Collapse sidebar' },
  'nav.expand_sidebar': { ar: 'توسيع القائمة', en: 'Expand sidebar' },
  'nav.theme_toggle': { ar: 'تبديل الوضع', en: 'Toggle theme' },
  'nav.language_toggle': { ar: 'تبديل اللغة', en: 'Toggle language' },
  'nav.user_menu': { ar: 'قائمة المستخدم', en: 'User menu' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Sign out' },
  'role.admin': { ar: 'مدير', en: 'Admin' },
  'role.employee': { ar: 'موظّف', en: 'Employee' },
  
  // Fields
  'field.firstName': { ar: 'الاسم', en: 'First Name' },
  'field.lastName': { ar: 'الكنية', en: 'Last Name' },
  'field.escId': { ar: 'ESC ID', en: 'ESC ID' },
  'field.membershipNumber': { ar: 'رقم العضوية', en: 'Membership Number' },
  'field.city': { ar: 'المحافظة', en: 'City' },
  'field.fullName': { ar: 'الاسم بالعربية', en: 'Arabic Name' },
  'field.fatherName': { ar: 'اسم الوالد', en: 'Father\'s Name' },
  'field.englishName': { ar: 'الاسم بالإنكليزية', en: 'English Name' },
  'field.birthDate': { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
  'field.gender': { ar: 'الجنس', en: 'Gender' },
  'field.specialty': { ar: 'الاختصاص', en: 'Specialty' },
  'field.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'field.phone': { ar: 'الهاتف', en: 'Phone' },
  'field.workAddress': { ar: 'عنوان العمل', en: 'Work Address' },
  'field.joinDate': { ar: 'تاريخ الانتساب', en: 'Join Date' },
  'field.membershipType': { ar: 'نوع العضوية', en: 'Membership Type' },
  
  // Subscriptions
  'sub.value': { ar: 'قيمة الاشتراك', en: 'Amount' },
  'sub.year': { ar: 'سنة الاشتراك', en: 'Year' },
  'sub.notes': { ar: 'الملاحظات', en: 'Notes' },
  'sub.total': { ar: 'مجموع الاشتراكات', en: 'Total Subscriptions' },
  'sub.add': { ar: 'تسديد اشتراك', en: 'Add Payment' },
  'sub.history': { ar: 'سجل الاشتراكات', en: 'Subscription History' },

  // Actions
  'action.save': { ar: 'حفظ', en: 'Save' },
  'action.edit': { ar: 'تعديل', en: 'Edit' },
  'action.delete': { ar: 'حذف', en: 'Delete' },
  'action.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'action.search': { ar: 'بحث عن اسم...', en: 'Search by name...' },
  'action.export_excel': { ar: 'تصدير إكسل', en: 'Export Excel' },
  'action.print_pdf': { ar: 'طباعة تقرير', en: 'Print Report' },
  'action.view_details': { ar: 'عرض التفاصيل', en: 'View Details' },
  'app.no_results': { ar: 'لا توجد نتائج مطابقة', en: 'No results found.' },
  'app.auto_generated': { ar: 'توليد تلقائي', en: 'Auto-generated' },
  'app.success': { ar: 'تم الحفظ بنجاح', en: 'Saved successfully' },

  // Values
  'val.male': { ar: 'ذكر', en: 'Male' },
  'val.female': { ar: 'أنثى', en: 'Female' },
  'val.original': { ar: 'أصيل', en: 'Original' },
  'val.associate': { ar: 'مشارك', en: 'Associate' },
  'val.cardiac_surgery': { ar: 'جراحة قلب', en: 'Cardiac Surgery' },
  'val.cardiology': { ar: 'قلبية داخلية', en: 'Cardiology' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
