import { useLanguage } from "@/context/LanguageContext";
import { useMembers } from "@/context/MembersContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function Home() {
  const { t } = useLanguage();
  const { members } = useMembers();

  const totalMembers = members.length;
  const totalAssociate = members.filter(m => m.membershipType === 'associate').length;
  const totalOriginal = members.filter(m => m.membershipType === 'original').length;
  
  // Calculate top specialty
  const specialtyStats = members.reduce((acc, curr) => {
    acc[curr.specialty] = (acc[curr.specialty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSpecialty = Object.entries(specialtyStats).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  const chartData = Object.entries(specialtyStats).map(([key, value]) => ({
    name: t(`val.${key}`) || key,
    count: value
  }));

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('nav.home')}</h2>
          <p className="text-muted-foreground mt-1">{t('app.title')}</p>
        </div>
        <Link href="/add-member">
          <Button className="shadow-sm">
            <UserPlus className="me-2 h-4 w-4" />
            {t('nav.add_member')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('nav.members')} 
          value={totalMembers} 
          icon={Users} 
          description={`${totalOriginal} ${t('val.original')} - ${totalAssociate} ${t('val.associate')}`} 
        />
        <StatCard 
          title={t('field.specialty')} 
          value={t(`val.${topSpecialty[0]}`) || topSpecialty[0]} 
          icon={CreditCard} 
          description={`${topSpecialty[1]} ${t('nav.members')}`} 
        />
        <StatCard 
          title={t('val.original')} 
          value={totalOriginal} 
          icon={UserCheck} 
          description={`${Math.round((totalOriginal / (totalMembers || 1)) * 100)}%`} 
        />
        <StatCard 
          title={t('val.associate')} 
          value={totalAssociate} 
          icon={Users} 
          description={`${Math.round((totalAssociate / (totalMembers || 1)) * 100)}%`} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">{t('field.specialty')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">{t('sub.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.flatMap(m => m.subscriptions.map(s => ({...s, memberName: m.fullName})))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((sub, i) => (
                  <div key={i} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{sub.memberName}</p>
                      <p className="text-xs text-muted-foreground">{sub.year}</p>
                    </div>
                    <div className="mr-auto font-medium text-sm">+{sub.amount.toLocaleString()}</div>
                  </div>
                ))
              }
              {members.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
