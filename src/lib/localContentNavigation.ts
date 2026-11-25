/** Bulk98: original FrontMenu/KnowledgeCenter model column mapping, all SQL read-only. */
export const PUBLIC_MENU_LIST = `SELECT front_menu_id AS id, parent_id, name, link, is_show, status, type, position
 FROM front_menu WHERE status = 1 AND is_show = 1 ORDER BY type ASC, position ASC, front_menu_id ASC`;
export const PUBLIC_MENU_COUNT = `SELECT COUNT(*) AS total FROM front_menu WHERE status = 1 AND is_show = 1`;
export const PUBLIC_MENU_DETAIL = `SELECT front_menu_id AS id, parent_id, name, link, is_show, status, type, position
 FROM front_menu WHERE front_menu_id = ? AND status = 1 AND is_show = 1 LIMIT 1`;
export const ADMIN_MENU_LIST = `SELECT front_menu_id AS id, parent_id, name, link, is_show, status, type, position, created_at, updated_at
 FROM front_menu ORDER BY type ASC, position ASC, front_menu_id ASC LIMIT ? OFFSET ?`;
export const ADMIN_MENU_COUNT = `SELECT COUNT(*) AS total FROM front_menu`;
export const ADMIN_MENU_DETAIL = `SELECT front_menu_id AS id, parent_id, name, link, is_show, status, type, position, created_at, updated_at
 FROM front_menu WHERE front_menu_id = ? LIMIT 1`;
export const PUBLIC_KNOWLEDGE_LIST = `SELECT k.knowledge_center_id AS id, k.name, k.video_url, k.file_id, u.file AS file_name, k.created_at, k.updated_at
 FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id = k.file_id
 WHERE k.status = 1 AND k.is_delete = 0 ORDER BY k.knowledge_center_id ASC LIMIT ? OFFSET ?`;
export const PUBLIC_KNOWLEDGE_COUNT = `SELECT COUNT(*) AS total FROM knowledge_centers WHERE status = 1 AND is_delete = 0`;
export const PUBLIC_KNOWLEDGE_DETAIL = `SELECT k.knowledge_center_id AS id, k.name, k.video_url, k.file_id, u.file AS file_name, k.created_at, k.updated_at
 FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id = k.file_id
 WHERE k.knowledge_center_id = ? AND k.status = 1 AND k.is_delete = 0 LIMIT 1`;
export const ADMIN_KNOWLEDGE_LIST = `SELECT k.knowledge_center_id AS id, k.name, k.video_url, k.file_id, u.file AS file_name, k.status, k.is_delete, k.created_at, k.updated_at
 FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id = k.file_id
 WHERE k.is_delete = ? ORDER BY k.knowledge_center_id DESC LIMIT ? OFFSET ?`;
export const ADMIN_KNOWLEDGE_COUNT = `SELECT COUNT(*) AS total FROM knowledge_centers WHERE is_delete = ?`;
export const ADMIN_KNOWLEDGE_DETAIL = `SELECT k.knowledge_center_id AS id, k.name, k.video_url, k.file_id, u.file AS file_name, k.status, k.is_delete, k.created_at, k.updated_at
 FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id = k.file_id
 WHERE k.knowledge_center_id = ? LIMIT 1`;

export function contentId(raw:string):number|null {
 if(!/^[1-9]\d{0,14}$/.test(raw))return null;
 const n=Number(raw);return Number.isSafeInteger(n)?n:null;
}
export function contentPaging(url:string) {
 const p=new URL(url).searchParams;
 const number=(value:string|null,fallback:number,max:number)=>{
  if(value===null)return fallback;
  if(!/^[1-9]\d{0,7}$/.test(value))return null;
  const n=Number(value);return Number.isSafeInteger(n)&&n<=max?n:null;
 };
 const page=number(p.get('page'),1,100000),limit=number(p.get('limit'),20,50);
 if(page===null||limit===null)return null;
 return {page,limit,offset:(page-1)*limit};
}
export function contentDeleted(url:string):0|1|null {
 const v=new URL(url).searchParams.get('deleted');
 return v===null||v==='0'?0:v==='1'?1:null;
}
export type MenuItem={id:number;parent_id:number;sub_menu?:MenuItem[]};
/** Hierarchy follows the original Express controller and never includes hidden parent nodes. */
export function menuHierarchy<T extends MenuItem>(items:T[]):T[] {
 const nodes=new Map<number,T>();
 for(const row of items)nodes.set(row.id,{...row,sub_menu:[]});
 const roots:T[]=[];
 for(const row of items){
  const item=nodes.get(row.id)!;
  if(row.parent_id===0)roots.push(item);
  else if(row.parent_id!==row.id&&nodes.has(row.parent_id)){
   const parent=nodes.get(row.parent_id)!;
   // Prevent self-reference and simple cycles from corrupting the response.
   if(parent.parent_id!==row.id)parent.sub_menu!.push(item);
  }
 }
 return roots;
}
