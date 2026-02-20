import type { AuditLogFilters } from "@/api/audit-logs/audit-logs.api";
import type { AuditLog } from "~shared/types/db/audit-logs.types";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClearAuditLogs } from "@/hooks/audit-logs/use-clear-audit-logs";
import { usePaginatedAuditLogs } from "@/hooks/audit-logs/use-paginated-audit-logs";
import { DataTable } from "~react/components/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~react/components/select";
import sayno from "~react/lib/sayno";
import { authorizeBatchQueryOptions } from "~react/queries/auth";

import { getAuditLogColumns } from "./audit-log.columns";

const ACTION_CATEGORIES = [
  "auth",
  "user",
  "account",
  "role",
  "invitation",
  "config",
  "auditLog",
  "impersonation",
  "permission",
  "system",
] as const;

const TARGET_TYPES = [
  "user",
  "role",
  "invitation",
  "config",
  "auditLog",
  "permission",
  "session",
  "system",
] as const;

export function AuditLogsDataTable() {
  const { t } = useTranslation("web");

  const { data: auditAuth } = useQuery(authorizeBatchQueryOptions([{ permission: "auditLog:delete" }]));
  const canDelete = auditAuth?.[0] ?? false;

  const [filters, setFilters] = useState<AuditLogFilters>({});

  const columns = useMemo(() => getAuditLogColumns(t), [t]);

  const auditLogsQuery = usePaginatedAuditLogs(filters);
  const clearMutation = useClearAuditLogs();

  const rows: AuditLog[] = useMemo(() => {
    return auditLogsQuery.data ?? [];
  }, [auditLogsQuery.data]);

  const handleClearLogs = async () => {
    const confirmation = await sayno.confirm({
      title: t("pages.logs.actions.clearLogs"),
      description: t("pages.logs.actions.clearLogsConfirm"),
      variant: "destructive",
    });

    if (confirmation) {
      clearMutation.mutate();
    }
  };

  const handleActionCategoryChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      actionCategory: value === "all" ? undefined : value,
    }));
  };

  const handleTargetTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      targetType: value === "all" ? undefined : value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={filters.actionCategory ?? "all"} onValueChange={handleActionCategoryChange}>
          <SelectTrigger size="sm">
            <SelectValue placeholder={t("pages.logs.filters.actionCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("pages.logs.filters.allActions")}</SelectItem>
            {ACTION_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {t(`pages.logs.filters.categories.${category}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.targetType ?? "all"} onValueChange={handleTargetTypeChange}>
          <SelectTrigger size="sm">
            <SelectValue placeholder={t("pages.logs.filters.targetType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("pages.logs.filters.allTargets")}</SelectItem>
            {TARGET_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {t(`pages.logs.filters.targets.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={auditLogsQuery.isLoading}
        searchPlaceholder={t("pages.logs.searchPlaceholder")}
        manualPagination
        manualSorting
        manualFiltering
        pagination={auditLogsQuery.paginationState}
        onPaginationChange={auditLogsQuery.onPaginationChange}
        pageCount={auditLogsQuery.pageCount}
        sorting={auditLogsQuery.sortingState}
        onSortingChange={auditLogsQuery.onSortingChange}
        searchValue={auditLogsQuery.searchValue}
        onSearchChange={auditLogsQuery.onSearchChange}
        // Clear items props
        clearItemsLabel={t("pages.logs.actions.clearLogs")}
        onClearItems={canDelete && rows.length ? handleClearLogs : undefined}
      />
    </div>
  );
}
