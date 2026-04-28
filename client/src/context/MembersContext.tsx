import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Member, Subscription } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MembersContextType {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'subscriptions'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addSubscription: (memberId: string, subscription: Omit<Subscription, 'id'>) => void;
  getMember: (id: string) => Member | undefined;
  isLoading: boolean;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (newMember: any) => {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add member');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "تمت إضافة العضو بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ في إضافة العضو", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "تم تحديث بيانات العضو" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "تم حذف العضو" });
    },
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async ({ memberId, sub }: { memberId: string; sub: any }) => {
      const res = await fetch(`/api/members/${memberId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "تم تسجيل الاشتراك بنجاح" });
    },
  });

  const addMember = (data: any) => addMemberMutation.mutate(data);
  const updateMember = (id: string, updates: any) => updateMemberMutation.mutate({ id, updates });
  const deleteMember = (id: string) => deleteMemberMutation.mutate(id);
  const addSubscription = (memberId: string, sub: any) => addSubscriptionMutation.mutate({ memberId, sub });
  const getMember = (id: string) => members.find(m => m.id === id);

  return (
    <MembersContext.Provider value={{ members, addMember, updateMember, deleteMember, addSubscription, getMember, isLoading }}>
      {children}
    </MembersContext.Provider>
  );
}

export function useMembers() {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error('useMembers must be used within a MembersProvider');
  }
  return context;
}
