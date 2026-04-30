import { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/context/LanguageContext";
import type {
  InsertMember,
  InsertSubscription,
  MemberWithSubscriptions,
  UpdateMember,
} from "@shared/schema";

interface MembersContextType {
  members: MemberWithSubscriptions[];
  addMember: (member: InsertMember) => void;
  updateMember: (id: string, updates: UpdateMember) => void;
  deleteMember: (id: string) => void;
  addSubscription: (memberId: string, subscription: InsertSubscription) => void;
  updateSubscription: (
    subscriptionId: string,
    updates: Partial<InsertSubscription>,
  ) => void;
  deleteSubscription: (subscriptionId: string) => void;
  getMember: (id: string) => MemberWithSubscriptions | undefined;
  isLoading: boolean;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const M = {
    addOk: isAr ? "تمت إضافة العضو بنجاح" : "Member added successfully",
    addErr: isAr ? "خطأ في إضافة العضو" : "Failed to add member",
    updOk: isAr ? "تم تحديث بيانات العضو" : "Member updated",
    updErr: isAr ? "خطأ في تحديث العضو" : "Failed to update member",
    delOk: isAr ? "تم حذف العضو" : "Member deleted",
    delErr: isAr ? "خطأ في حذف العضو" : "Failed to delete member",
    subAddOk: isAr ? "تم تسجيل الاشتراك بنجاح" : "Payment recorded",
    subAddErr: isAr ? "خطأ في تسجيل الاشتراك" : "Failed to record payment",
    subUpdOk: isAr ? "تم تحديث الاشتراك بنجاح" : "Payment updated",
    subUpdErr: isAr ? "خطأ في تحديث الاشتراك" : "Failed to update payment",
    subDelOk: isAr ? "تم حذف الاشتراك" : "Payment deleted",
    subDelErr: isAr ? "خطأ في حذف الاشتراك" : "Failed to delete payment",
  };

  const { data: members = [], isLoading } = useQuery<MemberWithSubscriptions[]>(
    {
      queryKey: ["/api/members"],
    },
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/members"] });

  const addMemberMutation = useMutation({
    mutationFn: async (newMember: InsertMember) => {
      const res = await apiRequest("POST", "/api/members", newMember);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.addOk });
    },
    onError: (error: any) => {
      toast({
        title: M.addErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateMember;
    }) => {
      const res = await apiRequest("PATCH", `/api/members/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.updOk });
    },
    onError: (error: any) => {
      toast({
        title: M.updErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/members/${id}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.delOk });
    },
    onError: (error: any) => {
      toast({
        title: M.delErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async ({
      memberId,
      sub,
    }: {
      memberId: string;
      sub: InsertSubscription;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/members/${memberId}/subscriptions`,
        sub,
      );
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.subAddOk });
    },
    onError: (error: any) => {
      toast({
        title: M.subAddErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      updates,
    }: {
      subscriptionId: string;
      updates: Partial<InsertSubscription>;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/subscriptions/${subscriptionId}`,
        updates,
      );
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.subUpdOk });
    },
    onError: (error: any) => {
      toast({
        title: M.subUpdErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: M.subDelOk });
    },
    onError: (error: any) => {
      toast({
        title: M.subDelErr,
        description: error?.message ?? "",
        variant: "destructive",
      });
    },
  });

  const value: MembersContextType = {
    members,
    addMember: (data) => addMemberMutation.mutate(data),
    updateMember: (id, updates) =>
      updateMemberMutation.mutate({ id, updates }),
    deleteMember: (id) => deleteMemberMutation.mutate(id),
    addSubscription: (memberId, sub) =>
      addSubscriptionMutation.mutate({ memberId, sub }),
    updateSubscription: (subscriptionId, updates) =>
      updateSubscriptionMutation.mutate({ subscriptionId, updates }),
    deleteSubscription: (subscriptionId) =>
      deleteSubscriptionMutation.mutate(subscriptionId),
    getMember: (id) => members.find((m) => m.id === id),
    isLoading,
  };

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  );
}

export function useMembers() {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error("useMembers must be used within a MembersProvider");
  }
  return context;
}
