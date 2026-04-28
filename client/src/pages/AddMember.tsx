import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/context/LanguageContext';
import { useMembers } from '@/context/MembersContext';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { GENDERS, MEMBERSHIP_TYPES, SPECIALTIES } from '@/lib/types';
import { ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Schema
const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  fullName: z.string().min(2, "Name is required"),
  fatherName: z.string().min(2, "Father name is required"),
  englishName: z.string().min(2, "English name is required"),
  birthDate: z.string().min(1, "Date is required"),
  gender: z.enum(['male', 'female']),
  specialty: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Required"),
  workAddress: z.string().min(2, "Required"),
  city: z.string().min(1, "Required"),
  joinDate: z.string().min(1, "Required"),
  membershipType: z.enum(['original', 'associate']),
  escId: z.string().optional(),
  membershipNumber: z.string().optional(),
});

export default function AddMember() {
  const { t, language } = useLanguage();
  const { getMember } = useMembers();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/edit-member/:id');
  const isEdit = match && !!params?.id;
  const { toast } = useToast();

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      fullName: '',
      fatherName: '',
      englishName: '',
      birthDate: '',
      gender: 'male',
      specialty: 'cardiology',
      email: '',
      phone: '',
      workAddress: '',
      city: '',
      joinDate: new Date().toISOString().split('T')[0],
      membershipType: 'original',
      escId: '',
      membershipNumber: '',
    }
  });

  useEffect(() => {
    if (isEdit && params?.id) {
      const member = getMember(params.id);
      if (member) {
        form.reset({
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          fullName: member.fullName,
          fatherName: member.fatherName,
          englishName: member.englishName,
          birthDate: member.birthDate,
          gender: member.gender,
          specialty: member.specialty,
          email: member.email,
          phone: member.phone,
          workAddress: member.workAddress,
          city: member.city || '',
          joinDate: member.joinDate,
          membershipType: member.membershipType,
          escId: member.escId || '',
          membershipNumber: member.membershipNumber || '',
        });
      } else {
        toast({ title: "Member not found", variant: "destructive" });
        setLocation('/members');
      }
    }
  }, [isEdit, params?.id, getMember, form, setLocation, toast]);

  const addMemberMutation = useMutation({
    mutationFn: async (newMember: any) => {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: t('app.success') || "تم الحفظ بنجاح" });
      setLocation('/members');
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/members/${params?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "تم التحديث بنجاح" });
      setLocation(`/member/${params?.id}`);
    }
  });

  function onSubmit(values: z.infer<typeof memberSchema>) {
    const { membershipNumber, ...rest } = values;
    if (isEdit && params?.id) {
      updateMemberMutation.mutate(rest);
    } else {
      addMemberMutation.mutate(rest);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isEdit ? `/member/${params?.id}` : '/members')}>
           <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('action.edit') : t('nav.add_member')}
        </h2>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info Group */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{t('field.fullName')} & {t('field.englishName')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.firstName')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.lastName')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.fullName')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="englishName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.englishName')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} className="text-left" dir="ltr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="fatherName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.fatherName')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="birthDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.birthDate')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.gender')} <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('field.gender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map(g => (
                              <SelectItem key={g.value} value={g.value}>{language === 'ar' ? g.labelAr : g.labelEn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Registry Info Group */}
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{t('field.membershipNumber')} & ESC ID</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="membershipNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.membershipNumber')}</FormLabel>
                        <FormControl><Input {...field} disabled placeholder={isEdit ? field.value : t('app.auto_generated') || "تلقائي"} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="escId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.escId')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Professional Info Group */}
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{t('field.specialty')} & {t('field.workAddress')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="specialty" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.specialty')} <span className="text-destructive">*</span></FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('field.specialty')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SPECIALTIES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{language === 'ar' ? s.labelAr : s.labelEn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="membershipType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.membershipType')} <span className="text-destructive">*</span></FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('field.membershipType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MEMBERSHIP_TYPES.map(m => (
                              <SelectItem key={m.value} value={m.value}>{language === 'ar' ? m.labelAr : m.labelEn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="joinDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.joinDate')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.city')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="workAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.workAddress')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Contact Info Group */}
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{t('field.phone')} & {t('field.email')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.phone')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} type="tel" className="text-left" dir="ltr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('field.email')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} type="email" className="text-left" dir="ltr" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => setLocation(isEdit ? `/member/${params?.id}` : '/members')}>
                  {t('action.cancel')}
                </Button>
                <Button type="submit" className="min-w-[150px]">
                  <Save className="me-2 h-4 w-4" />
                  {t('action.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
