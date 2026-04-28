import { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
      toast({ title: "تمت إضافة العضو بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة العضو",
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
      toast({ title: "تم تحديث بيانات العضو" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث العضو",
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
      toast({ title: "تم حذف العضو" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف العضو",
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
      toast({ title: "تم تسجيل الاشتراك بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الاشتراك",
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
      toast({ title: "تم تحديث الاشتراك بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الاشتراك",
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
      toast({ title: "تم حذف الاشتراك" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الاشتراك",
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
