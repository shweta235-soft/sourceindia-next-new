/** Legacy fileController read contract; only persisted file metadata, no file I/O. */
export const FILES_LIST_SQL = 'SELECT upload_image_id AS id, uuid, file, created_at, updated_at FROM upload_images ORDER BY upload_image_id ASC';
export const FILE_BY_ID_SQL = 'SELECT upload_image_id AS id, uuid, file, created_at, updated_at FROM upload_images WHERE upload_image_id = ? LIMIT 1';
export function validFileId(value: string): number | null {
  if (!/^[1-9]\d{0,14}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
