/** Bulk92 - read-only testimonial queries based on the original Testimonials and UploadImage Sequelize models. */
export const PUBLIC_TESTIMONIAL_LIST = `SELECT t.testimonial_id AS id, t.name, t.description,
  t.file_id, u.file AS file_name, t.created_at, t.updated_at
  FROM testimonials t
  LEFT JOIN upload_images u ON u.upload_image_id = t.file_id
  WHERE t.status = 1 AND t.is_delete = 0
  ORDER BY t.testimonial_id ASC LIMIT ? OFFSET ?`;

export const PUBLIC_TESTIMONIAL_COUNT = `SELECT COUNT(*) AS total FROM testimonials
  WHERE status = 1 AND is_delete = 0`;

export const PUBLIC_TESTIMONIAL_DETAIL = `SELECT t.testimonial_id AS id, t.name, t.description,
  t.file_id, u.file AS file_name, t.created_at, t.updated_at
  FROM testimonials t
  LEFT JOIN upload_images u ON u.upload_image_id = t.file_id
  WHERE t.testimonial_id = ? AND t.status = 1 AND t.is_delete = 0 LIMIT 1`;

export function parseTestimonialPaging(url: string) {
  const params = new URL(url).searchParams;
  const bounded = (value: string | null, maximum: number, fallback: number) => {
    if (value === null) return fallback;
    if (!/^[1-9]\d{0,8}$/.test(value)) return null;
    const n = Number(value);
    return Number.isSafeInteger(n) && n <= maximum ? n : null;
  };
  const page = bounded(params.get('page'), 100000, 1);
  const limit = bounded(params.get('limit'), 50, 20);
  if (page === null || limit === null) return null;
  return { page, limit, offset: (page - 1) * limit };
}

export function parseTestimonialId(value: string) {
  if (!/^[1-9]\d{0,14}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
