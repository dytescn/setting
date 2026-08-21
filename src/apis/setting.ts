// src/apis/setting.ts
// Setting 配置表数据库操作封装（使用 SQL 直接操作）

const BASE_URL = "http://127.0.0.1:44944";
const DB_PATH = "./info";

// ============ 底层数据库请求 ============
// deno-lint-ignore no-explicit-any
const databaseRequest = async (symbol: string, body: any) => {
  const url = `${BASE_URL}/database`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/libary",
      "FFI-Symbol": symbol,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

// ============ 初始化表 ============
let tableInitialized = false;

export const ensureSettingTable = async () => {
  if (tableInitialized) return;
  try {
    await databaseRequest("db_create", {
      path: DB_PATH,
      table: "setting",
      schema: `id INTEGER PRIMARY KEY AUTOINCREMENT,
               key TEXT NOT NULL UNIQUE,
               value TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    });
    console.log("✅ 表 setting 已创建或已存在");
  } catch (_) {
    console.log("ℹ️ 表 setting 可能已存在");
  }
  tableInitialized = true;
};

// ============ 类型定义 ============
export interface SettingItem {
  key: string;
  value: string;
}

// ============ 核心操作（通过 SQL 执行） ============

/**
 * 执行写操作（INSERT/UPDATE/DELETE）
 */
const execSql = async (sql: string) => {
  // 使用 db_insert 符号，但传递 sql 字段
  return databaseRequest("db_insert", { path: DB_PATH, sql });
};

/**
 * 执行查询操作（SELECT）
 */
const querySql = async (sql: string): Promise<SettingItem[]> => {
  const result = await databaseRequest("db_query", { path: DB_PATH, sql });
  // 后端返回格式可能是 { code, msg, data: { list: [...] } } 或直接 data 数组
  return result.data?.list || result.data || [];
};

// ============ 公开 API ============

/**
 * 设置配置项（如果存在则更新，否则插入）
 */
export const setSetting = async (key: string, value: string) => {
  await ensureSettingTable();
  // 使用 INSERT OR REPLACE
  await execSql(
    `INSERT OR REPLACE INTO setting (key, value, updated_at) VALUES ('${key}', '${value}', CURRENT_TIMESTAMP)`
  );
};

/**
 * 获取单个配置值
 */
export const getSetting = async (key: string): Promise<string | null> => {
  await ensureSettingTable();
  const rows = await querySql(`SELECT value FROM setting WHERE key = '${key}'`);
  return rows.length > 0 ? rows[0].value : null;
};

/**
 * 获取所有配置
 */
export const getAllSettings = async (): Promise<SettingItem[]> => {
  await ensureSettingTable();
  return await querySql("SELECT key, value FROM setting ORDER BY key");
};

/**
 * 删除配置
 */
export const deleteSetting = async (key: string) => {
  await ensureSettingTable();
  await execSql(`DELETE FROM setting WHERE key = '${key}'`);
};

/**
 * 批量设置配置
 */
export const setSettings = async (settings: Record<string, string>) => {
  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value);
  }
};

/**
 * 批量删除配置
 */
export const deleteSettings = async (keys: string[]) => {
  for (const key of keys) {
    await deleteSetting(key);
  }
};