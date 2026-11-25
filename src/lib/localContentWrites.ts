/** Bulk99: schema-compatible validated SQL operations; no schema migration. */
import {randomUUID} from 'node:crypto';
export const CONTENT_WRITE_FLAG = 'LOCAL_ADMIN_CONTENT_WRITES_ENABLED';
export function enabledContentWrites(){return process.env.LOCAL_ADMIN_CONTENT_WRITES_ENABLED === 'true';}
export type KnowledgeInput={name:string;video_url:string;file_id:number;status:0|1};
export type MenuInput={parent_id:number;name:string;link:string;is_show:0|1;status:0|1;type:1|2;position:number};
function object(x:unknown):x is Record<string,unknown>{return !!x&&typeof x==='object'&&!Array.isArray(x);}
function keys(x:Record<string,unknown>,expected:string[]){return Object.keys(x).sort().join('|')===expected.sort().join('|');}
function bit(x:unknown):x is 0|1{return x===0||x===1;}
function natural(x:unknown):x is number{return typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=2147483647;}
function positive(x:unknown):x is number{return natural(x)&&x>0;}
export function parseKnowledge(x:unknown):KnowledgeInput|null{
 if(!object(x)||!keys(x,['name','video_url','file_id','status']))return null;
 if(typeof x.name!=='string'||!x.name.trim()||x.name.trim().length>255)return null;
 if(typeof x.video_url!=='string'||x.video_url.length>2048||!bit(x.status)||!positive(x.file_id))return null;
 const video_url=x.video_url.trim();
 if(video_url&&!/^https?:\/\//i.test(video_url))return null;
 return {name:x.name.trim(),video_url,file_id:x.file_id,status:x.status};
}
export function parseMenu(x:unknown):MenuInput|null{
 if(!object(x)||!keys(x,['parent_id','name','link','is_show','status','type','position']))return null;
 if(!natural(x.parent_id)||!natural(x.position)||!bit(x.is_show)||!bit(x.status)||(x.type!==1&&x.type!==2))return null;
 if(typeof x.name!=='string'||!x.name.trim()||x.name.trim().length>255||typeof x.link!=='string'||x.link.length>2048)return null;
 const link=x.link.trim();
 if(/^(?:javascript|data|vbscript):/i.test(link)||/[\x00-\x1f]/.test(link))return null;
 return {parent_id:x.parent_id,name:x.name.trim(),link,is_show:x.is_show,status:x.status,type:x.type,position:x.position};
}
export function parseBitBody(x:unknown,key:'status'|'is_show'|'is_delete'):{value:0|1}|null{
 if(!object(x)||!keys(x,[key])||!bit(x[key]))return null;
 return {value:x[key]};
}
export function parseIds(x:unknown):number[]|null{
 if(!object(x)||!keys(x,['ids'])||!Array.isArray(x.ids)||!x.ids.length||x.ids.length>100)return null;
 if(!x.ids.every(positive))return null;
 const ids=[...new Set(x.ids as number[])];return ids;
}
export const KNOWLEDGE_INSERT='INSERT INTO knowledge_centers (uuid,name,file_id,video_url,status,is_delete,created_at,updated_at) VALUES (?,?,?,?,?,0,NOW(),NOW())';
export const KNOWLEDGE_UPDATE='UPDATE knowledge_centers SET name=?,file_id=?,video_url=?,status=?,updated_at=NOW() WHERE knowledge_center_id=? AND is_delete=0';
export const KNOWLEDGE_FILE='SELECT upload_image_id AS id FROM upload_images WHERE upload_image_id=? LIMIT 1';
export const KNOWLEDGE_DELETE='UPDATE knowledge_centers SET is_delete=1,updated_at=NOW() WHERE knowledge_center_id=? AND is_delete=0';
export const KNOWLEDGE_STATUS='UPDATE knowledge_centers SET status=?,updated_at=NOW() WHERE knowledge_center_id=? AND is_delete=0';
export const KNOWLEDGE_DELETE_STATUS='UPDATE knowledge_centers SET is_delete=?,updated_at=NOW() WHERE knowledge_center_id=?';
export const MENU_INSERT='INSERT INTO front_menu (uuid,parent_id,name,link,is_show,status,type,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())';
export const MENU_UPDATE='UPDATE front_menu SET parent_id=?,name=?,link=?,is_show=?,status=?,type=?,position=?,updated_at=NOW() WHERE front_menu_id=?';
export const MENU_PARENT='SELECT front_menu_id AS id,parent_id,type FROM front_menu WHERE front_menu_id=? LIMIT 1';
export const MENU_CHILDREN='SELECT front_menu_id AS id,parent_id,name,link,is_show,status,type,position FROM front_menu WHERE parent_id=? ORDER BY position ASC,front_menu_id ASC';
export const MENU_CHILD_COUNT='SELECT COUNT(*) AS total FROM front_menu WHERE parent_id=?';
export const MENU_DELETE='DELETE FROM front_menu WHERE front_menu_id=?';
export function contentUuid(){return randomUUID();}
