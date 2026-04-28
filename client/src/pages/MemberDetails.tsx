import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMembers } from '@/context/MembersContext';
import { useRoute, Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Printer, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Briefcase,
  Calendar,
  User,
  Plus,
  MapPin,
  Building2,
  Stethoscope
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import NotFound from './not-found';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table as DocxTable, 
  TableRow as DocxTableRow, 
  TableCell as DocxTableCell, 
  WidthType,
  AlignmentType,
  ImageRun
} from "docx";
import { saveAs } from "file-saver";
import logoBase64 from '../assets/logo.base64.txt?raw';

function InfoItem({ icon: Icon, label, value, isLtr = false }: { icon: any, label: string, value: string | null, isLtr?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all duration-200 min-h-[85px] justify-center">
      <div className="flex items-center gap-2 text-muted-foreground/60 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary/50" />
        <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{label}</span>
      </div>
      <p className={`text-sm font-bold text-foreground leading-snug break-words ${isLtr ? 'font-mono' : ''}`} dir={isLtr ? 'ltr' : 'rtl'}>
        {value}
      </p>
    </div>
  );
}

export default function MemberDetails() {
  const [, params] = useRoute('/member/:id');
  const { t, language } = useLanguage();
  const { getMember, deleteMember, addSubscription } = useMembers();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const member = getMember(params?.id || '');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ year: new Date().getFullYear(), amount: '', notes: '' });

  if (!member) return <NotFound />;

  const isAr = language === 'ar';

  const handleDelete = () => {
    if (confirm(t('Are you sure you want to delete this member?'))) {
      deleteMember(member.id);
      setLocation('/members');
    }
  };

  const handleAddPayment = () => {
    if (!newPayment.amount) {
      toast({ title: "Error", description: "Please enter amount", variant: "destructive" });
      return;
    }
    addSubscription(member.id, {
      year: Number(newPayment.year),
      amount: Number(newPayment.amount),
      notes: newPayment.notes,
      date: new Date().toISOString()
    });
    setIsPaymentOpen(false);
    setNewPayment({ year: new Date().getFullYear(), amount: '', notes: '' });
  };

  const generateWord = async () => {
    const logoData = logoBase64.trim();
    const binaryString = window.atob(logoData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: 80,
                  height: 80,
                },
                type: "jpg",
              } as any),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isAr ? "الرابطة السورية لأمراض وجراحة القلب" : "Syrian Cardiovascular Association",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isAr ? "تقرير معلومات عضو" : "Member Information Report",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: isAr ? "المعلومات الشخصية" : "Personal Information",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "الاسم الكامل" : "Full Name")] }),
                  new DocxTableCell({ children: [new Paragraph(member.fullName)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "الاسم بالانجليزية" : "English Name")] }),
                  new DocxTableCell({ children: [new Paragraph(member.englishName)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "اسم الأب" : "Father Name")] }),
                  new DocxTableCell({ children: [new Paragraph(member.fatherName)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "تاريخ الميلاد" : "Birth Date")] }),
                  new DocxTableCell({ children: [new Paragraph(member.birthDate)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "الجنس" : "Gender")] }),
                  new DocxTableCell({ children: [new Paragraph(t(`val.${member.gender}`))] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "التخصص" : "Specialty")] }),
                  new DocxTableCell({ children: [new Paragraph(t(`val.${member.specialty}`))] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "عنوان العمل" : "Work Address")] }),
                  new DocxTableCell({ children: [new Paragraph(member.workAddress)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "تاريخ الانضمام" : "Join Date")] }),
                  new DocxTableCell({ children: [new Paragraph(member.joinDate)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "رقم الهاتف" : "Phone")] }),
                  new DocxTableCell({ children: [new Paragraph(member.phone)] }),
                ],
              }),
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "البريد الإلكتروني" : "Email")] }),
                  new DocxTableCell({ children: [new Paragraph(member.email)] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: isAr ? "سجل الاشتراكات" : "Subscription History",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "السنة" : "Year")] }),
                  new DocxTableCell({ children: [new Paragraph(isAr ? "المبلغ" : "Amount")] }),
                  new DocxTableCell({ children: [new Paragraph(isAr ? "ملاحظات" : "Notes")] }),
                ],
              }),
              ...member.subscriptions.map(sub => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(sub.year.toString())] }),
                  new DocxTableCell({ children: [new Paragraph(sub.amount.toLocaleString())] }),
                  new DocxTableCell({ children: [new Paragraph(sub.notes || "-")] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Member_${member.fullName}.docx`);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/members')} className="rounded-full">
            <ArrowRight className={`h-5 w-5 ${isAr ? 'rotate-180' : ''}`} />
          </Button>
          <span className="text-muted-foreground font-medium">{t('action.view_details')}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/edit-member/${member.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="me-2 h-4 w-4 text-blue-500" />
              {t('action.edit')}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/members/${member.id}/pdf`, '_blank')}>
            <Printer className="me-2 h-4 w-4 text-green-600" />
            {isAr ? "تحميل PDF" : "Download PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={generateWord}>
            <Printer className="me-2 h-4 w-4 text-blue-600" />
            {isAr ? "تصدير Word" : "Word"}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="member-report-content" className="space-y-8 bg-background p-8 print:p-0 print:space-y-6">
        <div className="text-center space-y-2 py-8 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border-b print:py-4 print:bg-none print:border-b-2">
          <Badge variant="secondary" className="px-4 py-1 mb-2 print:border-2">
            {t(`val.${member.membershipType}`)}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary print:text-3xl print:text-black">
            {member.fullName}
          </h1>
          <p className="text-xl text-muted-foreground font-medium print:text-lg print:text-gray-700" dir="ltr">
            {member.englishName}
          </p>
          <div className="flex justify-center gap-4 mt-4 print:mt-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm print:border-0 print:shadow-none print:text-black">
              <Calendar className="h-4 w-4 text-primary print:hidden" />
              <span className="hidden print:inline font-bold">{isAr ? 'تاريخ الانضمام:' : 'Join Date:'}</span>
              {member.joinDate}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm print:border-0 print:shadow-none print:text-black">
              <Building2 className="h-4 w-4 text-primary print:hidden" />
              <span className="hidden print:inline font-bold">{isAr ? 'المدينة:' : 'City:'}</span>
              {member.city}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 border-s-4 border-primary">
            <h2 className="text-xl font-bold">{isAr ? 'المعلومات التفصيلية' : 'Detailed Information'}</h2>
          </div>
          <Card className="border shadow-md overflow-hidden bg-card">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoItem icon={User} label={t('field.fatherName')} value={member.fatherName} />
                <InfoItem icon={Calendar} label={t('field.birthDate')} value={member.birthDate} />
                <InfoItem icon={User} label={t('field.gender')} value={t(`val.${member.gender}`)} />
                <InfoItem icon={Stethoscope} label={t('field.specialty')} value={t(`val.${member.specialty}`)} />
                <InfoItem icon={Building2} label={t('field.workAddress')} value={member.workAddress} />
                <InfoItem icon={Phone} label={t('field.phone')} value={member.phone} isLtr />
                <InfoItem icon={Mail} label={t('field.email')} value={member.email} isLtr />
                <InfoItem icon={Calendar} label={t('field.membershipNumber')} value={member.membershipNumber?.toString() || '-'} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 border-s-4 border-primary">
            <h2 className="text-xl font-bold">{t('sub.history')}</h2>
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 print:hidden shadow-sm">
                  <Plus className="me-2 h-4 w-4" />
                  {t('sub.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{t('sub.add')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t('sub.year')}</Label>
                      <Input 
                        type="number" 
                        value={newPayment.year} 
                        onChange={e => setNewPayment({...newPayment, year: parseInt(e.target.value)})}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t('sub.value')}</Label>
                      <Input 
                        type="number" 
                        value={newPayment.amount} 
                        onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('sub.notes')}</Label>
                    <Input 
                      value={newPayment.notes} 
                      onChange={e => setNewPayment({...newPayment, notes: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <Button onClick={handleAddPayment} className="w-full h-11 text-lg mt-2">{t('action.save')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card className="border shadow-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-32 text-center font-bold text-foreground">{t('sub.year')}</TableHead>
                    <TableHead className="font-bold text-foreground text-start">{t('sub.value')}</TableHead>
                    <TableHead className="font-bold text-foreground text-start">{t('sub.notes')}</TableHead>
                    <TableHead className="text-center font-bold text-foreground">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-medium">
                        {isAr ? 'لا يوجد سجل اشتراكات لهذا العضو' : 'No subscription records found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    member.subscriptions
                      .sort((a, b) => b.year - a.year)
                      .map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="px-3 py-1 font-bold text-xs">
                              {sub.year}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm text-start text-primary">
                            {sub.amount.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">{isAr ? 'ل.س' : 'SYP'}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-start text-xs font-medium">
                            {sub.notes || '-'}
                          </TableCell>
                          <TableCell className="text-center text-[10px] text-muted-foreground/70 font-mono">
                            {sub.date ? new Date(sub.date).toLocaleDateString(isAr ? 'ar-SY' : 'en-US') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
