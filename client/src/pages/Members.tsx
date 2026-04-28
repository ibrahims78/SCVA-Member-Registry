import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMembers } from '@/context/MembersContext';
import { Link } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, FileSpreadsheet, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Members() {
  const { t, language } = useLanguage();
  const { members } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.membershipNumber?.toString().includes(searchTerm) ||
    m.phone.includes(searchTerm)
  );

  const exportToExcel = () => {
    const data = filteredMembers.map(m => ({
      [t('field.membershipNumber')]: m.membershipNumber,
      [t('field.fullName')]: m.fullName,
      [t('field.fatherName')]: m.fatherName,
      [t('field.englishName')]: m.englishName,
      [t('field.birthDate')]: m.birthDate,
      [t('field.gender')]: t(`val.${m.gender}`),
      [t('field.specialty')]: t(`val.${m.specialty}`),
      [t('field.email')]: m.email,
      [t('field.phone')]: m.phone,
      [t('field.workAddress')]: m.workAddress,
      [t('field.joinDate')]: m.joinDate,
      [t('field.membershipType')]: t(`val.${m.membershipType}`),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "SCVA_Members.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('nav.members')}</h2>
          <p className="text-muted-foreground">{t('app.title')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToExcel} className="flex-1 sm:flex-none">
            <FileSpreadsheet className="me-2 h-4 w-4" />
            {t('action.export_excel')}
          </Button>
          <Link href="/add-member">
            <Button className="flex-1 sm:flex-none">
              <UserPlus className="me-2 h-4 w-4" />
              {t('nav.add_member')}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input 
              placeholder={t('action.search')} 
              className={`pl-10 ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('field.membershipNumber')}</TableHead>
                  <TableHead className="text-start">{t('field.fullName')}</TableHead>
                  <TableHead className="text-start hidden md:table-cell">{t('field.specialty')}</TableHead>
                  <TableHead className="text-start hidden sm:table-cell">{t('field.phone')}</TableHead>
                  <TableHead className="text-start hidden lg:table-cell">{t('field.membershipType')}</TableHead>
                  <TableHead className="text-end">{t('action.view_details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t('app.no_results')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs">#{member.membershipNumber}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{member.fullName}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{t(`val.${member.specialty}`)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal">
                          {t(`val.${member.specialty}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{member.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={member.membershipType === 'original' ? 'default' : 'outline'}>
                          {t(`val.${member.membershipType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <Link href={`/member/${member.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
