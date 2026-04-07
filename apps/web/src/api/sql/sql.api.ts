import { api } from "~react/lib/http";

// ============================================================================
// SQL Execution
// ============================================================================

export async function executeSql(query: string) {
  const res = await api.sql.execute.$post({ json: { query } });

  if (!res.ok && res.status !== 400) {
    throw new Error("Failed to execute query");
  }

  return res.json();
}

// ============================================================================
// Table Schema
// ============================================================================

export async function fetchTableSchema() {
  const res = await api.sql.tables.$get();

  if (!res.ok) throw new Error("Failed to fetch table schema");

  return res.json();
}

// ============================================================================
// SQL Sheets
// ============================================================================

export async function fetchSqlSheets() {
  const res = await api.sql.sheets.$get();

  if (!res.ok) throw new Error("Failed to fetch SQL sheets");

  return res.json();
}

export async function createSqlSheetRequest(data: { name: string; query: string }) {
  const res = await api.sql.sheets.$post({ json: data });

  if (!res.ok) throw new Error("Failed to create SQL sheet");

  return res.json();
}

export async function updateSqlSheetRequest(id: string, data: { name?: string; query?: string }) {
  const res = await api.sql.sheets[":id"].$patch({ param: { id }, json: data });

  if (!res.ok) throw new Error("Failed to update SQL sheet");

  return res.json();
}

export async function deleteSqlSheetRequest(id: string) {
  const res = await api.sql.sheets[":id"].$delete({ param: { id } });

  if (!res.ok) throw new Error("Failed to delete SQL sheet");

  return res.json();
}
