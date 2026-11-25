import type {NextRequest} from 'next/server';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {adminFaqResponse,adminFaqSameOrigin,authorizedAdminFaq} from '@/lib/localAdminFaqAuth';
import {enabledContentWrites,KNOWLEDGE_FILE,MENU_PARENT} from '@/lib/localContentWrites';
export function authorizeContent(req:NextRequest):Response|null{
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(!enabledContentWrites())return adminFaqResponse({message:'Content writes disabled.'},503);
 return null;
}
export async function contentBody(req:NextRequest):Promise<unknown>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 const length=Number(req.headers.get('content-length')||0);if(!Number.isSafeInteger(length)||length>12000)return null;
 try{const t=await req.text();return t.length<=12000?JSON.parse(t):null;}catch{return null;}
}
export async function knowledgeFileExists(db:Pool,id:number){const [r]=await db.execute<RowDataPacket[]>(KNOWLEDGE_FILE,[id]);return r.length>0;}
export async function menuParentValid(db:Pool,id:number,type:1|2,self?:number){
 if(id===0)return true;
 if(id===self)return false;
 const [r]=await db.execute<RowDataPacket[]>(MENU_PARENT,[id]);
 if(!r[0]||r[0].type!==type)return false;
 if(self){
  // Traverse ancestors to prevent indirect circular menu references.
  let parent=id;const visited=new Set<number>();
  while(parent!==0){if(parent===self||visited.has(parent))return false;visited.add(parent);
   const [rows]=await db.execute<RowDataPacket[]>(MENU_PARENT,[parent]);
   if(!rows[0])return false;parent=Number(rows[0].parent_id);
  }
 }
 return true;
}
