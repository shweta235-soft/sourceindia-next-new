import "server-only";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { LocalUserProfileRow } from "@/lib/localUserProfile";
import { ownCompanySql, type LocalCompanyProfileRow } from "@/lib/localCompanyProfile";

let pool: Pool | undefined;

/** Only explicit local DB credentials are accepted. Never silently query the live API. */
export function localAccountDatabase(): Pool | null {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || DB_PASSWORD === undefined || !DB_NAME) return null;
  if (!pool) pool = mysql.createPool({
    host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
    port: Number(process.env.DB_PORT || "3306"),
    waitForConnections: true, connectionLimit: 5, queueLimit: 20,
    connectTimeout: 8000, enableKeepAlive: true,
    multipleStatements: false, namedPlaceholders: false,
  });
  return pool;
}

export interface LocalAccountRow extends RowDataPacket {
  id: number;
  fname: string;
  lname: string;
  email: string;
  is_seller: number;
  company_id: number | null;
  password: string;
}

export async function accountByEmail(email: string): Promise<LocalAccountRow | null> {
  const db = localAccountDatabase();
  if (!db) throw new Error("LOCAL_DB_NOT_CONFIGURED");
  const [rows] = await db.execute<LocalAccountRow[]>(
    `SELECT user_id AS id, fname, lname, email, is_seller, company_id, password
       FROM users WHERE email = ? AND is_delete = 0 AND status = 1 LIMIT 1`, [email]);
  return rows[0] ?? null;
}

/** Explicit field selection avoids RowDataPacket's string index signature
 * collapsing Omit<LocalAccountRow, "password"> into a type without named fields. */
export type LocalSessionAccount = Pick<LocalAccountRow, "id" | "fname" | "lname" | "email" | "is_seller" | "company_id">;

export async function accountById(id: number): Promise<LocalSessionAccount | null> {
  const db = localAccountDatabase();
  if (!db) throw new Error("LOCAL_DB_NOT_CONFIGURED");
  const [rows] = await db.execute<LocalAccountRow[]>(
    `SELECT user_id AS id, fname, lname, email, is_seller, company_id
       FROM users WHERE user_id = ? AND is_delete = 0 AND status = 1 LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** Read-only, account-scoped profile query; never SELECT * or return secrets. */
export async function localProfileById(id: number): Promise<LocalUserProfileRow | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const db = localAccountDatabase();
  if (!db) throw new Error("LOCAL_DB_NOT_CONFIGURED");
  const [rows] = await db.execute<(RowDataPacket & LocalUserProfileRow)[]>(
    `SELECT user_id AS id, fname, lname, email, is_seller, company_id,
            mobile, alternate_number, country_code, country, state, city,
            address, zipcode, website, user_company
       FROM users
      WHERE user_id = ? AND is_delete = 0 AND status = 1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Only the authenticated user's company (verified by a JOIN). Read-only. */
export async function ownCompanyByUserId(id: number): Promise<LocalCompanyProfileRow | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const db = localAccountDatabase();
  if (!db) throw new Error("LOCAL_DB_NOT_CONFIGURED");
  const [rows] = await db.execute<(RowDataPacket & LocalCompanyProfileRow)[]>(ownCompanySql, [id]);
  return rows[0] ?? null;
}
