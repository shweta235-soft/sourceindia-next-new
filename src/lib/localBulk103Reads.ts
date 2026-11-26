/** Bulk103: read-only sub-interest and admin shortcut database contracts. */
export const BULK103_SQL = {
  interestPublic: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id, c.name AS category_name
    FROM interest_sub_categories s INNER JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    WHERE s.status=1 AND c.status=1 ORDER BY s.interest_sub_category_id ASC LIMIT ? OFFSET ?`,
  interestPublicCount: `SELECT COUNT(*) AS total FROM interest_sub_categories s
    INNER JOIN interest_categories c ON c.interest_category_id=s.interest_category_id WHERE s.status=1 AND c.status=1`,
  interestPublicDetail: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id, c.name AS category_name
    FROM interest_sub_categories s INNER JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    WHERE s.status=1 AND c.status=1 AND s.interest_sub_category_id=? LIMIT 1`,
  interestPublicCategory: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id
    FROM interest_sub_categories s INNER JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    WHERE s.status=1 AND c.status=1 AND s.interest_category_id=? ORDER BY s.interest_sub_category_id ASC LIMIT ? OFFSET ?`,
  interestAdmin: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id,
    c.name AS category_name, s.status, s.created_at, s.updated_at
    FROM interest_sub_categories s LEFT JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    ORDER BY s.interest_sub_category_id DESC LIMIT ? OFFSET ?`,
  interestAdminCount: `SELECT COUNT(*) AS total FROM interest_sub_categories`,
  interestAdminDetail: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id,
    c.name AS category_name, s.status, s.created_at, s.updated_at
    FROM interest_sub_categories s LEFT JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    WHERE s.interest_sub_category_id=? LIMIT 1`,
  interestAdminCategory: `SELECT s.interest_sub_category_id AS id, s.uuid, s.name, s.interest_category_id,
    c.name AS category_name, s.status, s.created_at, s.updated_at
    FROM interest_sub_categories s LEFT JOIN interest_categories c ON c.interest_category_id=s.interest_category_id
    WHERE s.interest_category_id=? ORDER BY s.interest_sub_category_id ASC LIMIT ? OFFSET ?`,
  shortcutAdmin: `SELECT shortcut_id AS id, uuid, name, link, status, is_delete, created_at, updated_at
    FROM shortcut_menus WHERE is_delete=0 ORDER BY shortcut_id ASC LIMIT ? OFFSET ?`,
  shortcutAdminCount: `SELECT COUNT(*) AS total FROM shortcut_menus WHERE is_delete=0`,
  shortcutAdminDetail: `SELECT shortcut_id AS id, uuid, name, link, status, is_delete, created_at, updated_at
    FROM shortcut_menus WHERE shortcut_id=? AND is_delete=0 LIMIT 1`,
} as const;
export {bulk101Id as bulk103Id, bulk101Paging as bulk103Paging} from './localBulk101Reads';
