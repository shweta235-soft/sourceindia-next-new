/** Bulk109 read-only Admin lookup contract. All identifiers supplied to SQL are from
 * static specifications. User input is bound as parameter values, never SQL text. */
export const BULK109_KINDS = Object.freeze(['sellers','buyers','users','companies','enquiries','tickets','buyer-enquiries']);
export const BULK109_ACTIONS = Object.freeze(['list','count','serverSide','filtered','detail','summary']);
export function bulk109Id(raw){
 if(typeof raw!=='string'||!/^[1-9]\d{0,14}$/.test(raw))return null;
 const v=Number(raw);return Number.isSafeInteger(v)&&v>0?v:null;
}
export function bulk109Page(params){
 const page=bulk109Id(params.get('page')??'1');
 const limit=bulk109Id(params.get('limit')??'10');
 if(!page||!limit||limit>100||page>100000||((page-1)*limit)>1000000)return null;
 return {page,limit,offset:(page-1)*limit};
}
export function bulk109Like(s){return `%${s.replace(/[!%_]/g,'!$&')}%`;}
export function bulk109Text(value,max=100){
 if(value===null)return '';
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001f]/.test(value))return null;
 return value.trim();
}
export function bulk109BooleanFlag(raw){return raw===null?false:raw==='true'?true:raw==='false'?false:null;}
export function bulk109Search(params){return bulk109Text(params.get('search'),100);}
export function bulk109Sort(params,allowed,defaultCol){
 const requested=params.get('sortBy')??'id';
 const direction=params.get('sort')??'DESC';
 if(!Object.prototype.hasOwnProperty.call(allowed,requested)||!['ASC','DESC'].includes(direction))return null;
 const expr=allowed[requested];
 if(typeof expr!=='string'||!expr)return null;
 return ` ORDER BY ${expr} ${direction}, ${defaultCol} DESC`;
}
/** Plan user pagination against the users primary key before optional reference-table
 * enrichment. This is safe only when both filtering and sorting use users columns.
 * Joined search and joined sort retain the original query semantics instead.
 */
const USER_LOCAL_SORT_KEYS = new Set([
 'id','fname','lname','email','mobile','status','is_approve','is_complete',
 'created_at','updated_at','full_name',
]);
export function bulk109UsersPageFirst(kind,params){
 return kind==='users' && bulk109Search(params)==='' &&
  USER_LOCAL_SORT_KEYS.has(params.get('sortBy')??'id');
}
/** Reconstruct the exact bounded primary-key page order after enrichment. */
export function bulk109OrderByIds(ids,rows){
 const order=new Map(ids.map((id,i)=>[String(id),i]));
 return [...rows].sort((a,b)=>
  (order.get(String(a.id))??Number.MAX_SAFE_INTEGER)-
  (order.get(String(b.id))??Number.MAX_SAFE_INTEGER));
}
export function bulk109Query(params,kind){
 const common=['page','limit','sortBy','sort','search'];
 const flags=['getDeleted','getInactive','getNotApproved','getNotCompleted','todayOnly','country','state','city','status','is_approve','is_complete','is_delete'];
 const allowed=kind==='sellers'||kind==='buyers'?[...common,...flags]:
  kind==='users'?[...common,'getDeleted','todayOnly','country','state','city','status','is_approve','is_complete','is_delete']:
  kind==='companies'?[...common,'getDeleted']:
  kind==='enquiries'?[...common,'getDeleted','status','is_approve','is_delete','user_id','company_id']:
  kind==='tickets'?[...common,'status','category','priority']:
  kind==='buyer-enquiries'?[...common,'user_id','company_id']:[];
 for(const key of params.keys())if(!allowed.includes(key))return false;
 if(bulk109Search(params)===null)return false;
 for(const key of ['getDeleted','getInactive','getNotApproved','getNotCompleted','todayOnly']){
  if(bulk109BooleanFlag(params.get(key))===null)return false;
 }
 for(const key of ['country','state','city','user_id','company_id','category']){
  const v=params.get(key);if(v!==null&&bulk109Id(v)===null)return false;
 }
 for(const key of ['status','is_approve','is_complete','is_delete']){
  const v=params.get(key);if(v!==null&&(key==='status'&&kind==='tickets'?!/^[0123]$/.test(v):!/^[01]$/.test(v)))return false;
 }
 if(bulk109Text(params.get('priority'),40)===null)return false;
 return true;
}

/** UTC database bounds corresponding to midnight–midnight Asia/Kolkata. */
export function bulk109IndiaBounds(now=new Date()){
 const local=new Date(now.getTime()+330*60000);
 const start=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-330*60000);
 const end=new Date(start.getTime()+86400000);
 return [start.toISOString().slice(0,19).replace('T',' '),end.toISOString().slice(0,19).replace('T',' ')];
}
