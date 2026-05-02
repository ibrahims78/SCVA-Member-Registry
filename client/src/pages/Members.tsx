import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useMembers } from "@/context/MembersContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  FileSpreadsheet,
  UserPlus,
  Users,
  SearchX,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { MEMBERSHIP_TYPES, SPECIALTIES } from "@/lib/types";
import { MEMBER_COLUMNS } from "@/lib/importColumns";

const ALL_VALUE = "__all__";

export default function Members() {
  const { t, language, direction } = useLanguage();
  const { members, isLoading } = useMembers();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isAr = language === "ar";
  const ArrowGo = direction === "rtl" ? ArrowLeft : ArrowRight;
  const isRtl = direction === "rtl";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const FirstIcon = isRtl ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRtl ? ChevronsLeft : ChevronsRight;

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members.filter((m) => {
      if (specialtyFilter !== ALL_VALUE && m.specialty !== specialtyFilter) return false;
      if (typeFilter !== ALL_VALUE && m.membershipType !== typeFilter) return false;
      if (!q) return true;
      return (
        (m.fullName ?? "").toLowerCase().includes(q) ||
        (m.englishName ?? "").toLowerCase().includes(q) ||
        m.membershipNumber?.toString().includes(q) ||
        (m.phone ?? "").includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, searchTerm, specialtyFilter, typeFilter]);

  const hasActiveFilters =
    searchTerm.length > 0 || specialtyFilter !== ALL_VALUE || typeFilter !== ALL_VALUE;

  const clearFilters = () => {
    setSearchTerm("");
    setSpecialtyFilter(ALL_VALUE);
    setTypeFilter(ALL_VALUE);
  };

  // ---- Pagination ----
  const totalCount = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Reset to first page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, specialtyFilter, typeFilter, pageSize]);

  // Clamp current page if data shrinks
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, currentPage * pageSize);

  // Build a compact list of page numbers (with ellipses) to render
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    const pages: (number | "…")[] = [];
    const window = 1;
    const push = (p: number | "…") => {
      if (pages[pages.length - 1] !== p) pages.push(p);
    };
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= currentPage - window && p <= currentPage + window)
      ) {
        push(p);
      } else if (
        (p === currentPage - window - 1 && p > 1) ||
        (p === currentPage + window + 1 && p < totalPages)
      ) {
        push("…");
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const exportToExcel = () => {
    // Use MEMBER_COLUMNS so headers match what the import parser expects
    // (bilingual: Arabic when UI is Arabic, English when English).
    // Values are always stored as raw enum strings so the file is importable as-is.
    const colDefs = MEMBER_COLUMNS.map((c) => ({
      key: c.key,
      label: (isAr ? c.labelAr : c.labelEn).replace(" *", ""),
    }));

    const data = filteredMembers.map((m) => {
      const row: Record<string, unknown> = {};
      for (const { key, label } of colDefs) {
        switch (key) {
          case "firstName":      row[label] = m.firstName ?? ""; break;
          case "lastName":       row[label] = m.lastName ?? ""; break;
          case "fullName":       row[label] = m.fullName ?? ""; break;
          case "fatherName":     row[label] = m.fatherName ?? ""; break;
          case "englishName":    row[label] = m.englishName ?? ""; break;
          case "birthDate":      row[label] = m.birthDate ?? ""; break;
          case "gender":         row[label] = m.gender ?? ""; break;
          case "specialty":      row[label] = m.specialty ?? ""; break;
          case "email":          row[label] = m.email ?? ""; break;
          case "phone":          row[label] = m.phone ?? ""; break;
          case "city":           row[label] = m.city ?? ""; break;
          case "workAddress":    row[label] = m.workAddress ?? ""; break;
          case "joinDate":       row[label] = m.joinDate ?? ""; break;
          case "membershipType": row[label] = m.membershipType ?? ""; break;
          case "escId":          row[label] = m.escId ?? ""; break;
        }
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = colDefs.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isAr ? "الأعضاء" : "Members");
    XLSX.writeFile(wb, isAr ? "اعضاء-SCVA.xlsx" : "SCVA-Members.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* ===== Page header ===== */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid="text-page-title"
          >
            {t("nav.members")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? isAr ? "جارٍ تحميل القائمة..." : "Loading..."
              : isAr
              ? `${members.length} عضو في القاعدة${
                  hasActiveFilters ? ` · ${filteredMembers.length} نتيجة مطابِقة` : ""
                }`
              : `${members.length} members${
                  hasActiveFilters ? ` · ${filteredMembers.length} matches` : ""
                }`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={isLoading || filteredMembers.length === 0}
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="me-2 h-4 w-4" />
            {t("action.export_excel")}
          </Button>
          <Link href="/add-member">
            <Button data-testid="button-add-member">
              <UserPlus className="me-2 h-4 w-4" />
              {t("nav.add_member")}
            </Button>
          </Link>
        </div>
      </header>

      {/* ===== Filters ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px_auto]">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isAr
                    ? "ابحث بالاسم أو الرقم أو الهاتف أو البريد..."
                    : "Search by name, number, phone, email..."
                }
                className="ps-10 pe-9"
                data-testid="input-search"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 -translate-y-1/2 end-2 p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted"
                  aria-label={isAr ? "مسح البحث" : "Clear search"}
                  data-testid="button-clear-search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger data-testid="select-specialty-filter">
                <SelectValue
                  placeholder={isAr ? "كلّ الاختصاصات" : "All specialties"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>
                  {isAr ? "كلّ الاختصاصات" : "All specialties"}
                </SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {isAr ? s.labelAr : s.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder={isAr ? "كلّ الأنواع" : "All types"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>
                  {isAr ? "كلّ الأنواع" : "All types"}
                </SelectItem>
                {MEMBERSHIP_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {isAr ? m.labelAr : m.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                data-testid="button-clear-filters"
                className="text-muted-foreground"
              >
                <X className="me-1.5 h-4 w-4" />
                {isAr ? "مسح المرشّحات" : "Clear filters"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== Table ===== */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-start w-32">
                  {t("field.membershipNumber")}
                </TableHead>
                <TableHead className="text-start">{t("field.fullName")}</TableHead>
                <TableHead className="text-start hidden md:table-cell">
                  {t("field.specialty")}
                </TableHead>
                <TableHead className="text-start hidden sm:table-cell">
                  {t("field.phone")}
                </TableHead>
                <TableHead className="text-start hidden lg:table-cell">
                  {t("field.city")}
                </TableHead>
                <TableHead className="text-start hidden lg:table-cell">
                  {t("field.membershipType")}
                </TableHead>
                <TableHead className="text-end w-16" aria-label="actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    {members.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title={isAr ? "لا يوجد أعضاء بعد" : "No members yet"}
                        description={
                          isAr
                            ? "ابدأ بإضافة العضو الأوّل لقاعدة البيانات."
                            : "Get started by adding your first member."
                        }
                        action={
                          <Link href="/add-member">
                            <Button data-testid="button-add-first-member">
                              <UserPlus className="me-2 h-4 w-4" />
                              {t("nav.add_member")}
                            </Button>
                          </Link>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={SearchX}
                        title={t("app.no_results")}
                        description={
                          isAr
                            ? "جرّب تغيير كلمات البحث أو إعادة ضبط المرشّحات."
                            : "Try adjusting your search or clearing filters."
                        }
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            data-testid="button-clear-filters-empty"
                          >
                            {isAr ? "إعادة ضبط" : "Clear filters"}
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pagedMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className={cn(
                      "group cursor-pointer hover:bg-muted/40 transition-colors",
                    )}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("a, button")) return;
                      setLocation(`/member/${member.id}`);
                    }}
                    data-testid={`row-member-${member.id}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                      #{member.membershipNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground">{member.fullName}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {t(`val.${member.specialty}`)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="font-normal">
                        {t(`val.${member.specialty}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums" dir="ltr">
                      <span className="block text-start">{member.phone}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {member.city || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant={member.membershipType === "original" ? "default" : "outline"}
                      >
                        {t(`val.${member.membershipType}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Link href={`/member/${member.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("action.view_details")}
                          data-testid={`button-view-${member.id}`}
                          className="text-muted-foreground group-hover:text-foreground"
                        >
                          <ArrowGo className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ===== Pagination footer ===== */}
        {!isLoading && totalCount > 0 && (
          <div
            className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            data-testid="pagination-footer"
          >
            {/* Page size selector + range info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{isAr ? "السجلات في الصفحة:" : "Rows per page:"}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger
                    className="h-8 w-[80px]"
                    data-testid="select-page-size"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span
                className="tabular-nums"
                data-testid="text-pagination-range"
              >
                {isAr
                  ? `${rangeStart}–${rangeEnd} من ${totalCount}`
                  : `${rangeStart}–${rangeEnd} of ${totalCount}`}
              </span>
            </div>

            {/* Page nav buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label={isAr ? "الصفحة الأولى" : "First page"}
                data-testid="button-page-first"
              >
                <FirstIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label={isAr ? "السابق" : "Previous"}
                data-testid="button-page-prev"
              >
                <PrevIcon className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`e-${i}`}
                      className="px-1 text-xs text-muted-foreground"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-sm tabular-nums",
                        p === currentPage && "pointer-events-none",
                      )}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      aria-label={
                        isAr ? `الصفحة ${p}` : `Page ${p}`
                      }
                      data-testid={`button-page-${p}`}
                    >
                      {p}
                    </Button>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label={isAr ? "التالي" : "Next"}
                data-testid="button-page-next"
              >
                <NextIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label={isAr ? "الصفحة الأخيرة" : "Last page"}
                data-testid="button-page-last"
              >
                <LastIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
