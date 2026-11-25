import {createHash} from 'node:crypto';
import { parseBuyerMessagePreview } from './localBuyerMessagePreview.ts';

/** Bulk86: deterministic UUID allows database uniqueness to reject duplicate submissions. */
export function parseBuyerMessageSend(value:unknown) {
  if (!value || typeof value!=='object' || Array.isArray(value)) return null;
  const obj=value as Record<string,unknown>;
  if (Object.keys(obj).some(k=>!['company_id','title','message','request_id'].includes(k))) return null;
  const {request_id,...rest}=obj;
  const input=parseBuyerMessagePreview(rest);
  if (!input || typeof request_id!=='string' || !/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(request_id)) return null;
  return {...input,requestId:request_id.toLowerCase()};
}
export function deduplicationUuid(senderId:number,requestId:string,secret:string) {
  const b=createHash('sha256').update(`buyer-msg:v1:${senderId}:${requestId}:${secret}`).digest();
  b[6]=(b[6]&15)|0x40; b[8]=(b[8]&63)|0x80;
  const h=b.subarray(0,16).toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}
export function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));}
export function buyerTemplateRender(template:string,receiverName:string,senderCompany:string,title:string,message:string) {
  const vars:{[key:string]:string}={USER_NAME:receiverName,SENDER_USER:senderCompany,TITLE:title,MESSAGE:message};
  return template.replace(/\{\{\s*(USER_NAME|SENDER_USER|TITLE|MESSAGE)\s*\}\}/gi,(_s,key:string)=>escapeHtml(vars[key.toUpperCase()]??''));
}
export const buyerMessageExistingSql=`SELECT b.buyerenquiry_id AS id, b.user_id, b.reciever_id, b.title, b.message, u.company_id AS receiver_company_id FROM buyerenquiry b LEFT JOIN users u ON u.user_id = b.reciever_id WHERE b.uuid = ? LIMIT 1`;
export const buyerMessageInsertSql=`INSERT INTO buyerenquiry (uuid,user_id,reciever_id,title,message,created_at,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
