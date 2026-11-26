/** Bulk108 input contracts. All operations are Admin-scoped; no user-supplied SQL identifiers. */
export type EmailInput = { title?:string;email_for?:string|null;subject?:string;description?:string;message?:string;is_seller_direct?:0|1;status?:0|1 };
export type NewsletterInput = {title?:string;subject?:string;description?:string;user_type?:number};
const own=(v:Record<string,unknown>,k:string)=>Object.prototype.hasOwnProperty.call(v,k);
function record(value:unknown, allowed:readonly string[], maxKeys:number):Record<string,unknown>|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const obj=value as Record<string,unknown>;
 const keys=Object.keys(obj);
 return keys.length>0&&keys.length<=maxKeys&&keys.every(k=>allowed.includes(k))?obj:null;
}
function string(value:unknown,max:number):string|null {
 if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))return null;
 return value.trim();
}
export function bulk108EmailInput(value:unknown, creating:boolean):EmailInput|null {
 const names=['title','email_for','subject','description','message','is_seller_direct','status'];
 const input=record(value,names,7);if(!input)return null;
 if(creating&&['title','subject','description','message','is_seller_direct','status'].some(k=>!own(input,k)))return null;
 const out:EmailInput={};
 for(const [key,raw] of Object.entries(input)){
  if(key==='status'||key==='is_seller_direct'){
   if(raw!==0&&raw!==1)return null;
   out[key]=raw;
  }else if(key==='email_for'){
   if(raw===null){out.email_for=null;continue;}
   const s=string(raw,255);if(!s)return null;out.email_for=s;
  }else{
   const s=string(raw,key==='message'?100000:key==='description'||key==='subject'?20000:255);
   if(!s)return null;
   if(key==='title')out.title=s;
   if(key==='subject')out.subject=s;
   if(key==='description')out.description=s;
   if(key==='message')out.message=s;
  }
 }
 return out;
}
export function bulk108NewsletterEdit(value:unknown):NewsletterInput|null{
 const input=record(value,['title','subject','description','user_type'],4);if(!input)return null;
 const out:NewsletterInput={};
 for(const [key,raw] of Object.entries(input)){
  if(key==='user_type'){
   if(typeof raw!=='number'||!Number.isSafeInteger(raw)||raw<1||raw>2147483647)return null;
   out.user_type=raw;
  }else{
   const s=string(raw,key==='description'?100000:255);if(!s)return null;
   if(key==='title')out.title=s;
   if(key==='subject')out.subject=s;
   if(key==='description')out.description=s;
  }
 }
 return out;
}
export function bulk108PositiveId(value:unknown):number|null{
 if(typeof value!=='string'&&typeof value!=='number')return null;
 if(typeof value==='string'&&!/^[1-9]\d{0,9}$/.test(value))return null;
 const n=Number(value);return Number.isSafeInteger(n)&&n>0&&n<=2147483647?n:null;
}
export function bulk108Clone(value:unknown):number|null{
 const input=record(value,['id'],1);
 return input?bulk108PositiveId(input.id):null;
}
export function bulk108DeleteStatus(value:unknown):0|1|null{
 const input=record(value,['is_delete'],1);
 return input&&(input.is_delete===0||input.is_delete===1)?input.is_delete:null;
}
export function bulk108SelectedIds(value:unknown):number[]|null{
 const input=record(value,['ids'],1);
 if(!input||!Array.isArray(input.ids)||input.ids.length<1||input.ids.length>50)return null;
 const ids=input.ids.map(bulk108PositiveId);
 if(ids.some(x=>x===null))return null;
 const values=ids as number[];
 return new Set(values).size===values.length?values:null;
}
export function bulk108Paging(url:string){
 const q=new URL(url).searchParams;
 const p=q.get('page')??'1',l=q.get('limit')??'10';
 if(!/^[1-9]\d{0,5}$/.test(p)||!/^[1-9]\d{0,2}$/.test(l))return null;
 const page=Number(p),limit=Number(l);
 if(limit>100||page>100000)return null;
 return {page,limit,offset:(page-1)*limit};
}
export function bulk108Search(url:string):string|null{
 const value=(new URL(url).searchParams.get('search')??'').trim();
 return value.length<=100&&!/[\x00-\x1f]/.test(value)?value:null;
}
export function bulk108Order(url:string,allowed:Record<string,string>):string|null{
 const q=new URL(url).searchParams;
 const raw=q.get('sortBy')??'id';
 const direction=q.get('sort')??'DESC';
 const column=allowed[raw];
 if(!column||!['ASC','DESC'].includes(direction))return null;
 return ` ORDER BY ${column} ${direction}`;
}
/** Escape SQL wildcard input to stop users expanding a literal search into an unconstrained scan. */
export function bulk108Like(value:string):string{
 return `%${value.replace(/[\\%_]/g,c=>'\\'+c)}%`;
}
