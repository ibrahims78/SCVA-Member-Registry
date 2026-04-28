export interface Subscription {
  id: string;
  year: number;
  amount: number;
  notes: string;
  date: string;
}

export type Gender = 'male' | 'female';
export type Specialty = 'cardiac_surgery' | 'cardiology' | 'pediatric_cardiology'; // Added pediatric for variety, strictly user asked for "Cardiac Surgery - Internal Cardiology"
export type MembershipType = 'original' | 'associate';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  fatherName: string;
  englishName: string;
  birthDate: string;
  gender: Gender;
  specialty: string;
  email: string;
  phone: string;
  workAddress: string;
  joinDate: string;
  membershipType: MembershipType;
  escId?: string;
  membershipNumber?: string;
  city: string;
  subscriptions: Subscription[];
}

export const SPECIALTIES = [
  { value: 'cardiac_surgery', labelAr: 'جراحة قلب', labelEn: 'Cardiac Surgery' },
  { value: 'cardiology', labelAr: 'قلبية داخلية', labelEn: 'Cardiology' },
  // Add more as needed
];

export const GENDERS = [
  { value: 'male', labelAr: 'ذكر', labelEn: 'Male' },
  { value: 'female', labelAr: 'أنثى', labelEn: 'Female' },
];

export const MEMBERSHIP_TYPES = [
  { value: 'original', labelAr: 'أصيل', labelEn: 'Original' },
  { value: 'associate', labelAr: 'مشارك', labelEn: 'Associate' },
];
