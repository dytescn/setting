// src/apis/designdb.ts
// 数据库操作封装（仅用于 designsoft 表）

const BASE_URL = "http://127.0.0.1:44944";
const DB_PATH = "./info";
const TABLE_NAME = "designsoft";

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

// ============ 类型定义 ============
export interface SoftwareInfo {
  id?: number;
  name: string;
  version: string;
  major_version?: string;   // 新增
  minor_version?: string;   // 新增
  install_path?: string;
  publisher?: string;
  install_date?: string;
  exe_path?: string;
  status?: "未安装" | "已安装但未启动" | "已启动";
  config?: any;
  child?: any;
  created_at?: string;
  updated_at?: string;
}

// ============ 辅助函数（转义 SQL 字符串） ============
const escapeSql = (str: string) => str.replace(/'/g, "''");

// ============ 公开数据库操作函数 ============

/**
 * 插入一条软件信息
 */
export const insertSoftware = async (data: Omit<SoftwareInfo, "id">) => {
  const columns = [
    "name", "version", "major_version", "minor_version", "install_path",
    "publisher", "install_date", "exe_path", "status", "config", "child"
  ];
  const values = columns.map(col => {
    const val = data[col as keyof typeof data] ?? "";
    return `'${escapeSql(String(val))}'`;
  });
  const sql = `
    INSERT INTO ${TABLE_NAME} (${columns.join(", ")})
    VALUES (${values.join(", ")})
  `;
  return databaseRequest("db_insert", { path: DB_PATH, sql });
};

/**
 * 查询软件信息（可选条件）
 */
export const querySoftware = async (condition?: string) => {
  let sql = `SELECT * FROM ${TABLE_NAME}`;
  if (condition) {
    sql += ` WHERE ${condition}`;
  }
  const result = await databaseRequest("db_query", { path: DB_PATH, sql });
  if (result.data?.list) return result.data.list;
  if (Array.isArray(result.data)) return result.data;
  return [];
};

/**
 * 更新软件信息（按 id）
 */
export const updateSoftware = async (id: number, data: Partial<SoftwareInfo>) => {
  const setClauses = Object.entries(data)
    .filter(([key]) => key !== "id" && key !== "created_at")
    .map(([key, value]) => {
      const v = value ?? "";
      return `${key} = '${escapeSql(String(v))}'`;
    });
  if (setClauses.length === 0) {
    throw new Error("No fields to update");
  }
  const sql = `
    UPDATE ${TABLE_NAME}
    SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
  return databaseRequest("db_update", { path: DB_PATH, sql });
};

/**
 * 删除软件信息（按 id）
 */
export const deleteSoftware = async (id: number) => {
  const sql = `DELETE FROM ${TABLE_NAME} WHERE id = ${id}`;
  return databaseRequest("db_delete", { path: DB_PATH, sql });
};

/**
 * 同步：从 API 获取软件信息并插入/更新数据库
 */
export const syncSoftwareFromApi = async (
  keyword: string,
  getInfoFn: (keyword: string) => Promise<any>
) => {
  const info = await getInfoFn(keyword);
  if (!info.data?.list || info.data.list.length === 0) {
    console.warn(`未找到关键字 "${keyword}" 对应的软件`);
    return;
  }

  for (const software of info.data.list) {
    const existing = await querySoftware(`name = '${escapeSql(software.name)}' AND version = '${escapeSql(software.version)}'`);
    if (existing.length > 0) {
      await updateSoftware(existing[0].id, {
        major_version: software.major_version || "",
        minor_version: software.minor_version || "",
        install_path: software.install_path || "",
        updated_at: new Date().toISOString(),
      });
      console.log(`✅ 更新软件: ${software.name} (${software.version})`);
    } else {
      await insertSoftware({
        name: software.name,
        version: software.version,
        major_version: software.major_version || "",
        minor_version: software.minor_version || "",
        install_path: software.install_path || "",
        status: "已安装但未启动",
      });
      console.log(`✅ 插入软件: ${software.name} (${software.version})`);
    }
  }
};

/**
 * 获取数据库中所有已存储的软件列表
 */
export const getSoftwareList = async (): Promise<SoftwareInfo[]> => {
  return await querySoftware();
};