import { sql as sqlLang } from "@codemirror/lang-sql";
import { createFileRoute, redirect } from "@tanstack/react-router";
import CodeMirror, { keymap } from "@uiw/react-codemirror";
import { ChevronRightIcon, DatabaseIcon, FileIcon, GridIcon, PlayIcon, PlusIcon, SaveIcon, Table2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreateSqlSheet } from "@/hooks/sql/use-create-sql-sheet";
import { useDeleteSqlSheet } from "@/hooks/sql/use-delete-sql-sheet";
import { useExecuteSql } from "@/hooks/sql/use-execute-sql";
import { useSqlSheets } from "@/hooks/sql/use-sql-sheets";
import { useTableSchema } from "@/hooks/sql/use-table-schema";
import { useUpdateSqlSheet } from "@/hooks/sql/use-update-sql-sheet";
import { Button } from "~react/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~react/components/collapsible";
import { ScrollArea } from "~react/components/scroll-area";
import { cn } from "~react/lib/utils";
import { authorizeBatchQueryOptions } from "~react/queries/auth";

export const Route = createFileRoute("/_dashboard/sql")({
  component: SqlConsolePage,
  beforeLoad: async ({ context }) => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: "/" });
    }

    const results = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "sql:execute" }]),
    );

    if (!results[0]) {
      throw redirect({ to: "/" });
    }
  },
  staticData: { crumb: "pages.sql.title" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Sheet = {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  updatedAt: string;
};

type TableCol = {
  columnName: string;
  dataType: string;
  isNullable: boolean;
};

type TableSchema = {
  tableName: string;
  columns: TableCol[];
};

const TABLE_PAGE_SIZE = 50;

// ─── Page ─────────────────────────────────────────────────────────────────────

function SqlConsolePage() {
  const { t } = useTranslation("web");
  const { resolvedTheme } = useTheme();

  // Editor state
  const [query, setQuery] = useState("");
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetNameDraft, setSheetNameDraft] = useState("");

  // Table view state
  const [tableView, setTableView] = useState<{ table: TableSchema; page: number } | null>(null);

  // Data
  const { data: sheetsData } = useSqlSheets();
  const { data: tablesData } = useTableSchema();
  const { mutate: execute, data: execData, isPending: isExecuting, reset: resetExec } = useExecuteSql();
  const {
    mutate: executeTable,
    data: tableExecData,
    isPending: isTableExecuting,
    reset: resetTableExec,
  } = useExecuteSql();
  const createSheet = useCreateSqlSheet();
  const updateSheet = useUpdateSqlSheet();
  const deleteSheet = useDeleteSqlSheet();

  const sheets: Sheet[] = (sheetsData?.success ? sheetsData.data : []) as Sheet[];
  const tables: TableSchema[] = (tablesData?.success ? tablesData.data : []) as TableSchema[];
  const activeSheet = sheets.find(s => s.id === activeSheetId) ?? null;

  // Sync name draft when switching sheets
  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setSheetNameDraft(activeSheet?.name ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheetId]);

  // Fetch table data whenever tableView changes
  useEffect(() => {
    if (!tableView)
      return;
    const offset = tableView.page * TABLE_PAGE_SIZE;
    executeTable(
      `SELECT * FROM ${tableView.table.tableName} LIMIT ${TABLE_PAGE_SIZE} OFFSET ${offset};`,
    );
  }, [tableView, executeTable]);

  // Track editor dirty state (derived — avoids setState-in-effect warning)
  const isDirty = activeSheet ? query !== activeSheet.query : query.length > 0;

  // ── Editor handlers ──────────────────────────────────────────────────────

  const handleExecute = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed)
      return;
    setTableView(null);
    execute(trimmed);
  }, [execute, query]);

  const handleClear = useCallback(() => {
    setQuery("");
    setActiveSheetId(null);
    setTableView(null);
    resetExec();
    resetTableExec();
    // focus handled by CodeMirror
  }, [resetExec, resetTableExec]);

  const handleLoadSheet = useCallback((sheet: Sheet) => {
    setActiveSheetId(sheet.id);
    setQuery(sheet.query);
    setTableView(null);
    resetExec();
    // focus handled by CodeMirror
  }, [resetExec]);

  const handleNewSheet = useCallback(async () => {
    const result = await createSheet.mutateAsync({ name: "Untitled", query: "" });
    if (result.success) {
      const sheet = result.data as Sheet;
      setActiveSheetId(sheet.id);
      setQuery("");
      setTableView(null);
      resetExec();
      // focus handled by CodeMirror
    }
  }, [createSheet, resetExec]);

  const handleSave = useCallback(() => {
    if (!isDirty)
      return;
    if (activeSheetId) {
      updateSheet.mutate({ id: activeSheetId, data: { query } });
    } else {
      createSheet.mutate({ name: "Untitled", query }, {
        onSuccess: (result) => {
          if (result.success)
            setActiveSheetId((result.data as Sheet).id);
        },
      });
    }
  }, [activeSheetId, isDirty, query, updateSheet, createSheet]);

  const handleRenameSheet = useCallback((id: string, name: string) => {
    if (name.trim())
      updateSheet.mutate({ id, data: { name: name.trim() } });
  }, [updateSheet]);

  const handleDeleteSheet = useCallback((id: string) => {
    deleteSheet.mutate(id, {
      onSuccess: () => {
        if (activeSheetId === id) {
          setActiveSheetId(null);
          setQuery("");
          resetExec();
        }
      },
    });
  }, [deleteSheet, activeSheetId, resetExec]);

  // ── Table view handlers ──────────────────────────────────────────────────

  const handleViewTable = useCallback((table: TableSchema) => {
    resetTableExec();
    setTableView({ table, page: 0 });
  }, [resetTableExec]);

  const handleInsertTableQuery = useCallback((tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
    setActiveSheetId(null);
    setTableView(null);
    // focus handled by CodeMirror
  }, []);

  const handleTableViewPage = useCallback((page: number) => {
    setTableView(prev => prev ? { ...prev, page } : null);
  }, []);

  // ── CodeMirror extensions ────────────────────────────────────────────────

  const editorExtensions = [
    sqlLang(),
    keymap.of([
      { key: "Mod-Enter", run: () => { handleExecute(); return true; } }, // eslint-disable-line style/max-statements-per-line
      { key: "Mod-s", run: () => { handleSave(); return true; } }, // eslint-disable-line style/max-statements-per-line
    ]),
  ];

  // ── Derived data ─────────────────────────────────────────────────────────

  const result = execData?.success === true ? execData.data : null;
  const rawError = execData?.success === false ? execData.error : null;
  const queryError = rawError
    ? (typeof rawError === "string" ? rawError : (rawError as { message?: string }).message ?? "Query execution failed")
    : null;
  const queryColumns = result?.rows[0] ? Object.keys(result.rows[0]) : [];

  const tableResult = tableExecData?.success === true ? tableExecData.data : null;
  const tableColumns = tableView?.table.columns ?? [];
  const tableColNames = tableColumns.map(c => c.columnName);
  const tableHasMore = (tableResult?.rowCount ?? 0) === TABLE_PAGE_SIZE;
  const currentPage = tableView?.page ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 md:p-8 overflow-x-hidden">
      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-panel shrink-0">
        <div className="absolute inset-0 pointer-events-none hero-grid" />
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none bg-primary opacity-[0.18]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/20">
            <DatabaseIcon className="size-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight text-panel-heading">
              {t("pages.sql.title")}
            </h1>
            <p className="text-xs mt-0.5 text-panel-meta">
              {t("pages.sql.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 gap-4 items-start">

        {/* Left panel — sticky with max-height so it scrolls independently */}
        <div className="w-64 shrink-0 sticky top-6 max-h-[calc(100svh-7rem)] rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {/* Sheets */}
            <div className="p-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground px-1">
                  {t("pages.sql.sheets.title")}
                </span>
                <button
                  type="button"
                  onClick={handleNewSheet}
                  disabled={createSheet.isPending}
                  className="size-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>

              {sheets.length === 0 && (
                <p className="text-xs text-muted-foreground/60 px-1 py-1 italic">
                  {t("pages.sql.sheets.empty")}
                </p>
              )}

              <div className="space-y-0.5">
                {sheets.map(sheet => (
                  <SheetItem
                    key={sheet.id}
                    sheet={sheet}
                    isActive={activeSheetId === sheet.id && !tableView}
                    isDirty={activeSheetId === sheet.id && isDirty}
                    onLoad={() => handleLoadSheet(sheet)}
                    onRename={name => handleRenameSheet(sheet.id, name)}
                    onDelete={() => handleDeleteSheet(sheet.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mx-3 border-t border-border my-1" />

            {/* Table Explorer */}
            <div className="p-3 pt-2">
              <div className="flex items-center mb-2">
                <span className="text-xs font-medium text-muted-foreground px-1">
                  {t("pages.sql.tables.title")}
                </span>
              </div>

              {tables.length === 0 && (
                <p className="text-xs text-muted-foreground/60 px-1 py-1 italic">
                  {t("pages.sql.tables.empty")}
                </p>
              )}

              <div className="space-y-0.5">
                {tables.map(table => (
                  <TableItem
                    key={table.tableName}
                    table={table}
                    isViewing={tableView?.table.tableName === table.tableName}
                    onView={() => handleViewTable(table)}
                    onInsert={() => handleInsertTableQuery(table.tableName)}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Editor + Results / Table View */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          {/* Editor */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileIcon className="size-3.5 text-muted-foreground shrink-0" />
                {activeSheet
                  ? (
                      <input
                        value={sheetNameDraft}
                        onChange={e => setSheetNameDraft(e.target.value)}
                        onBlur={() => {
                          const name = sheetNameDraft.trim() || "Untitled";
                          setSheetNameDraft(name);
                          handleRenameSheet(activeSheet.id, name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            e.currentTarget.blur();
                          if (e.key === "Escape") {
                            setSheetNameDraft(activeSheet.name);
                            e.currentTarget.blur();
                          }
                        }}
                        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 truncate"
                        spellCheck={false}
                      />
                    )
                  : (
                      <span className="text-sm text-muted-foreground/60 truncate">
                        {t("pages.sql.editor.unsaved")}
                      </span>
                    )}
                {isDirty && <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />}
              </div>
              {result && !tableView && (
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {t("pages.sql.results.duration", { ms: result.duration })}
                </span>
              )}
            </div>

            <CodeMirror
              value={query}
              onChange={setQuery}
              extensions={editorExtensions}
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              placeholder={t("pages.sql.editor.placeholder")}
              minHeight="200px"
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true }}
              className="text-sm font-mono [&_.cm-editor]:outline-none [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:font-mono"
            />

            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  disabled={!query && !execData && !tableView}
                >
                  <Trash2Icon className="size-3.5" />
                  {t("pages.sql.editor.clear")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={!isDirty || updateSheet.isPending || createSheet.isPending}
                >
                  <SaveIcon className="size-3.5" />
                  {t("pages.sql.editor.save")}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {t("pages.sql.editor.shortcut")}
                </span>
                <Button
                  onClick={handleExecute}
                  disabled={!query.trim() || isExecuting}
                >
                  <PlayIcon className="size-3.5" />
                  {isExecuting ? t("pages.sql.editor.executing") : t("pages.sql.editor.execute")}
                </Button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {tableView && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Table view header */}
              <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium font-mono text-foreground">
                    {tableView.table.tableName}
                  </span>
                  {tableResult && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      —
                      {" "}
                      {t("pages.sql.tableView.rows", { count: tableResult.rowCount })}
                      {tableHasMore && "+"}
                      {" "}
                      {t("pages.sql.results.duration", { ms: tableResult.duration })}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTableView(null);
                    resetTableExec();
                  }}
                  className="size-5 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>

              {/* Column schema strip */}
              <div className="border-b border-border/50 px-4 py-1.5 flex gap-3 overflow-x-auto bg-muted/20">
                {tableColumns.map(col => (
                  <div key={col.columnName} className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-foreground/70">{col.columnName}</span>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1 rounded">
                      {col.dataType}
                    </span>
                    {!col.isNullable && (
                      <span className="text-[9px] text-primary/60 font-mono">NN</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Data grid */}
              <div className="max-h-[480px] overflow-auto">
                {isTableExecuting && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    <span className="animate-pulse">{t("pages.sql.results.loading")}</span>
                  </div>
                )}

                {!isTableExecuting && tableResult && tableResult.rows.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    {t("pages.sql.tableView.empty")}
                  </div>
                )}

                {!isTableExecuting && tableResult && tableResult.rows.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-border bg-muted/30">
                        {/* Row number header */}
                        <th className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground/50 w-10 select-none">
                          #
                        </th>
                        {tableColNames.map(col => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left font-mono text-xs font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableResult.rows.map((row, i) => (
                        <tr
                          key={i} // eslint-disable-line react/no-array-index-key
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground/40 select-none tabular-nums">
                            {currentPage * TABLE_PAGE_SIZE + i + 1}
                          </td>
                          {tableColNames.map(col => (
                            <td
                              key={col}
                              className="px-4 py-2 font-mono text-xs text-foreground whitespace-nowrap"
                            >
                              {row[col] === null || row[col] === undefined
                                ? <span className="text-muted-foreground/40 italic">NULL</span>
                                : (
                                    <span
                                      className="block max-w-60 truncate"
                                      title={String(row[col])}
                                    >
                                      {String(row[col])}
                                    </span>
                                  )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {tableResult && (
                <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("pages.sql.tableView.page", { page: currentPage + 1 })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTableViewPage(currentPage - 1)}
                      disabled={currentPage === 0 || isTableExecuting}
                    >
                      {t("pages.sql.tableView.prev")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTableViewPage(currentPage + 1)}
                      disabled={!tableHasMore || isTableExecuting}
                    >
                      {t("pages.sql.tableView.next")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Query Results */}
          {!tableView && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("pages.sql.results.label")}
                </span>
                {result && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("pages.sql.results.rowsAffected", { count: result.rowCount })}
                  </span>
                )}
              </div>

              <div className="min-h-28">
                {!execData && !isExecuting && (
                  <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                    {t("pages.sql.results.empty")}
                  </div>
                )}

                {isExecuting && (
                  <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                    <span className="animate-pulse">{t("pages.sql.results.loading")}</span>
                  </div>
                )}

                {queryError && (
                  <div className="p-4">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-mono text-sm text-destructive whitespace-pre-wrap">
                      {queryError}
                    </div>
                  </div>
                )}

                {result && result.rows.length === 0 && (
                  <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                    {t("pages.sql.results.noRows")}
                  </div>
                )}

                {result && result.rows.length > 0 && (
                  <div className="max-h-120 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground/50 w-10 select-none">
                            #
                          </th>
                          {queryColumns.map(col => (
                            <th
                              key={col}
                              className="px-4 py-2.5 text-left font-medium text-muted-foreground font-mono text-xs whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr
                            key={i} // eslint-disable-line react/no-array-index-key
                            className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-3 py-2.5 text-right font-mono text-[10px] text-muted-foreground/40 select-none tabular-nums">
                              {i + 1}
                            </td>
                            {queryColumns.map(col => (
                              <td
                                key={col}
                                className="px-4 py-2.5 font-mono text-xs text-foreground whitespace-nowrap"
                              >
                                {row[col] === null || row[col] === undefined
                                  ? <span className="text-muted-foreground/40 italic">NULL</span>
                                  : (
                                      <span
                                        className="block max-w-xs truncate"
                                        title={String(row[col])}
                                      >
                                        {String(row[col])}
                                      </span>
                                    )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sheet Item ───────────────────────────────────────────────────────────────

type SheetItemProps = {
  sheet: Sheet;
  isActive: boolean;
  isDirty: boolean;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
};

function SheetItem({ sheet, isActive, isDirty, onLoad, onRename, onDelete }: SheetItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sheet.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing)
      inputRef.current?.select();
  }, [isEditing]);

  const handleCommit = () => {
    onRename(editName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")
      handleCommit();
    if (e.key === "Escape") {
      setEditName(sheet.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer select-none",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground",
      )}
      onClick={() => !isEditing && onLoad()}
    >
      <FileIcon className={cn("size-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

      {isEditing
        ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              className="flex-1 min-w-0 text-sm bg-transparent outline-none border-b border-primary"
            />
          )
        : (
            <span
              className="flex-1 min-w-0 text-sm truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(sheet.name);
              }}
            >
              {sheet.name}
            </span>
          )}

      {isDirty && !isEditing && (
        <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 shrink-0 size-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Table Item ───────────────────────────────────────────────────────────────

type TableItemProps = {
  table: TableSchema;
  isViewing: boolean;
  onView: () => void;
  onInsert: () => void;
};

function TableItem({ table, isViewing, onView, onInsert }: TableItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn(
        "group flex items-center gap-1 rounded px-1 py-1 transition-colors",
        isViewing ? "bg-primary/10" : "hover:bg-muted",
      )}
      >
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
            <ChevronRightIcon
              className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
            />
            <Table2Icon className={cn("size-3 shrink-0", isViewing ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-sm truncate", isViewing ? "text-primary" : "text-foreground")}>
              {table.tableName}
            </span>
          </button>
        </CollapsibleTrigger>

        {/* View data button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className={cn(
            "shrink-0 size-5 flex items-center justify-center rounded transition-all",
            isViewing
              ? "opacity-100 bg-primary/20 text-primary"
              : "opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary",
          )}
        >
          <GridIcon className="size-3.5" />
        </button>

        {/* Insert SELECT button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsert();
          }}
          className="opacity-0 group-hover:opacity-100 shrink-0 size-5 flex items-center justify-center rounded hover:bg-muted-foreground/10 hover:text-foreground transition-all text-muted-foreground"
        >
          <PlayIcon className="size-3.5" />
        </button>
      </div>

      <CollapsibleContent>
        <div className="ml-5 pl-3 border-l border-border/50 pb-1">
          {table.columns.map(col => (
            <div key={col.columnName} className="flex items-center gap-2 py-0.5 px-1">
              <span className="text-xs font-mono text-foreground/80 truncate flex-1 min-w-0">{col.columnName}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 truncate max-w-20">{col.dataType}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
