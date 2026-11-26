import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const BULK106_RESOURCES=JSON.parse(readFileSync(resolve(root,'src/lib/bulk106-resources.json'),'utf8'));
export const BULK106_KINDS=Object.keys(BULK106_RESOURCES);
export const BULK106_STATUS_KINDS=BULK106_KINDS.filter(k=>BULK106_RESOURCES[k].status);
export function requiredSchema(){
 const result={};
 for(const d of Object.values(BULK106_RESOURCES)){
  const keys=[d.key,...d.columns,...(d.filterColumn?[d.filterColumn]:[]),...(d.deleted?['is_delete']:[])];
  result[d.table]=[...new Set(keys)];
 }
 return result;
}
export function validResponse(action,payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
 switch(action){
 case 'list':return Array.isArray(payload.items)&&Number.isInteger(payload.page)&&Number.isInteger(payload.limit);
 case 'count':return Number.isInteger(payload.total)&&payload.total>=0;
 case 'server-side':return Array.isArray(payload.data)&&Number.isInteger(payload.totalRecords)&&Number.isInteger(payload.filteredRecords);
 case 'invalid-ID':return typeof payload.message==='string';
 case 'auth':return typeof payload.message==='string';
 case 'disabled':return typeof payload.message==='string';
 default:return false;
 }
}
