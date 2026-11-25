/** Bulk88: public FAQ contract based on original Faq/FaqCategory models. */
export const PUBLIC_FAQ_LIST = `SELECT f.faq_id AS id, f.title, f.description, f.category,
  c.name AS category_name, f.created_at, f.updated_at
  FROM faqs f
  LEFT JOIN faqcategories c ON c.faqcategory_id = f.category AND c.status = 1
  WHERE f.status = 1 AND f.is_delete = 0
  ORDER BY f.faq_id ASC LIMIT ? OFFSET ?`;

export const PUBLIC_FAQ_COUNT = `SELECT COUNT(*) AS total FROM faqs WHERE status = 1 AND is_delete = 0`;

export const PUBLIC_FAQ_DETAIL = `SELECT f.faq_id AS id, f.title, f.description, f.category,
  c.name AS category_name, f.created_at, f.updated_at
  FROM faqs f
  LEFT JOIN faqcategories c ON c.faqcategory_id = f.category AND c.status = 1
  WHERE f.faq_id = ? AND f.status = 1 AND f.is_delete = 0 LIMIT 1`;

export const PUBLIC_FAQ_CATEGORIES = `SELECT faqcategory_id AS id, name FROM faqcategories
  WHERE status = 1 ORDER BY faqcategory_id ASC`;

/** Optional paging only. Reject malformed, negative and excessively large requests. */
export function parseFaqPaging(url:string) {
  const q=new URL(url).searchParams;
  const valid=(v:string|null, max:number, def:number)=>{
    if(v===null) return def;
    if(!/^[1-9]\d{0,8}$/.test(v)) return null;
    const n=Number(v);
    return Number.isSafeInteger(n)&&n<=max?n:null;
  };
  const page=valid(q.get('page'),100000,1);
  const limit=valid(q.get('limit'),50,20);
  if(page===null||limit===null) return null;
  return { page, limit, offset:(page-1)*limit };
}

export function parseFaqId(value:string) {
  if (!/^[1-9]\d{0,14}$/.test(value)) return null;
  const id=Number(value);
  return Number.isSafeInteger(id)?id:null;
}
