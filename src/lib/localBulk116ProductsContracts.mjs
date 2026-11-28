/** Original Express /v2/api/products read request adapter — strictly public, bounded.
 * This intentionally does NOT reproduce privileged drafts, writes or home rotation.
 * SQL identifier names are fixed, all user input goes through placeholders.
 */
export const BULK116_MAX_PAGE=1000;
export const BULK116_MAX_LIMIT=50;
const ID=/^[1-9]\d{0,8}$/;
const TRACK=/^utm_(?:source|medium|campaign|term|content|id)$/i;
const SORT={newest:'p.created_at DESC, p.product_id DESC',a_to_z:'p.title ASC, p.product_id DESC',z_to_a:'p.title DESC, p.product_id DESC'};
const COMPANY_SORT={newest:'ci.created_at DESC, ci.company_id DESC',a_to_z:'ci.organization_name ASC, ci.company_id DESC',z_to_a:'ci.organization_name DESC, ci.company_id DESC'};
const FILTERS={category:'p.category',sub_category:'p.sub_category',item_category_id:'p.item_category_id',item_subcategory_id:'p.item_subcategory_id',item_id:'p.item_id',company_id:'p.company_id',keyword_ids:'p.keyword_id',user_state:'u.state'};
const PRODUCT_KEYS=new Set(['page','limit','sort_by','title','search','is_front','is_delete','status','is_approve','is_featured','is_gold','is_recommended','best_product',...Object.keys(FILTERS)]);
const COMPANY_KEYS=new Set(['page','limit','sort_by','title','core_activity','activity','category','sub_category','user_state','is_delete','is_approve','is_seller','is_trading','item_category','item_subcategory','interest_sub_categories']);
export function bulk116Id(x){return typeof x==='string'&&ID.test(x)&&Number.isSafeInteger(Number(x))?Number(x):null;}
export function bulk116ParseUrl(raw,allowed){
 try{
  const u=new URL(raw),q=u.searchParams;
  for(const k of q.keys())if((!allowed.has(k)&&!TRACK.test(k))||q.getAll(k).length!==1)return null;
  return q;
 }catch{return null;}
}
const num=(s,defaultValue,max)=>{
 if(s===null)return defaultValue;
 if(!/^[1-9]\d{0,4}$/.test(s))return null;
 const n=Number(s);return n<=max?n:null;
};
export function bulk116Page(q){
 const page=num(q.get('page'),1,BULK116_MAX_PAGE),limit=num(q.get('limit'),20,BULK116_MAX_LIMIT);
 return page===null||limit===null?null:{page,limit,offset:(page-1)*limit};
}
function csv(s){
 const pieces=s.split(',');if(pieces.length>20||!pieces.length||pieces.some(x=>bulk116Id(x.trim())===null))return null;
 return [...new Set(pieces.map(x=>Number(x.trim())))];
}
export function bulk116Like(v){return `%${v.replace(/[!%_]/g,x=>'!'+x)}%`;}
export function bulk116ProductList(raw){
 const q=bulk116ParseUrl(raw,PRODUCT_KEYS);if(!q)return null;
 const paging=bulk116Page(q);if(!paging)return null;
 for(const [k,want] of [['is_delete','0'],['status','1'],['is_approve','1'],['is_front','1']])if(q.has(k)&&q.get(k)!==want)return null;
 const sort=q.get('sort_by')??'newest';if(!Object.hasOwn(SORT,sort))return null;
 const where=['p.is_delete = 0','p.status = 1','p.is_approve = 1','ci.is_delete = 0','u.status = 1','u.is_delete = 0','u.is_approve = 1'];
 const values=[];
 for(const [key,col] of Object.entries(FILTERS)){
  const rawValue=q.get(key);if(rawValue===null)continue;
  const ids=csv(rawValue);if(!ids)return null;
  where.push(`${col} IN (${ids.map(()=>'?').join(',')})`);values.push(...ids);
 }
 for(const flag of ['is_featured','is_gold','is_recommended','best_product']){
  if(!q.has(flag))continue;
  const v=q.get(flag);if(v!=='0'&&v!=='1')return null;
  where.push(`p.${flag} = ?`);values.push(Number(v));
 }
 const search=q.get('search')??q.get('title');if(search!==null){
  if(search.length>120||!search.trim())return null;
  where.push(`p.title LIKE ? ESCAPE '!'`);values.push(bulk116Like(search.trim()));
 }
 return {...paging,where:where.join(' AND '),values,order:SORT[sort]};
}
export function bulk116CompanyList(raw){
 const q=bulk116ParseUrl(raw,COMPANY_KEYS);if(!q)return null;
 const paging=bulk116Page(q);if(!paging)return null;
 if(q.has('is_delete')&&q.get('is_delete')!=='0')return null;
 if(q.has('is_approve')&&q.get('is_approve')!=='1')return null;
 const sort=q.get('sort_by')??'newest';if(!Object.hasOwn(COMPANY_SORT,sort))return null;
 const where=['ci.is_delete = 0','EXISTS (SELECT 1 FROM users ux WHERE ux.company_id=ci.company_id AND ux.status=1 AND ux.is_delete=0 AND ux.is_approve=1)'];
 const values=[];
 const title=q.get('title');if(title!==null){if(!title.trim()||title.length>120)return null;where.push(`ci.organization_name LIKE ? ESCAPE '!'`);values.push(bulk116Like(title.trim()));}
 for(const [key,col] of [['core_activity','ci.core_activity'],['activity','ci.activity']]){
  if(!q.has(key))continue;const id=bulk116Id(q.get(key));if(id===null)return null;where.push(`${col} = ?`);values.push(id);
 }
 for(const [key,col] of [['user_state','u2.state'],['is_seller','u2.is_seller'],['is_trading','u2.is_trading']]){
  if(!q.has(key))continue;
  const rawValue=q.get(key);const ids=key==='user_state'?csv(rawValue):rawValue==='0'||rawValue==='1'?[Number(rawValue)]:null;
  if(!ids)return null;
  where.push(`EXISTS (SELECT 1 FROM users u2 WHERE u2.company_id=ci.company_id AND u2.status=1 AND u2.is_delete=0 AND u2.is_approve=1 AND ${col} IN (${ids.map(()=>'?').join(',')}))`);
  values.push(...ids);
 }
 for(const [key,col] of [['category','p2.category'],['sub_category','p2.sub_category']]){
  if(!q.has(key))continue;const ids=csv(q.get(key));if(!ids)return null;
  where.push(`EXISTS (SELECT 1 FROM products p2 WHERE p2.company_id=ci.company_id AND p2.status=1 AND p2.is_approve=1 AND p2.is_delete=0 AND ${col} IN (${ids.map(()=>'?').join(',')}))`);
  values.push(...ids);
 }
 // The legacy buyer-interest filters are intentionally unsupported until relationship parity.
 if(['item_category','item_subcategory','interest_sub_categories'].some(k=>q.has(k)))return null;
 return {...paging,where:where.join(' AND '),values,order:COMPANY_SORT[sort]};
}
export function bulk116CompanyProducts(raw){
 const q=bulk116ParseUrl(raw,new Set(['company_id']));if(!q)return null;
 const value=q.get('company_id');
 return value===null?{error:400,body:{success:false,message:'Company ID is required',data:[]}}:
 bulk116Id(value)===null?{error:422,body:{success:false,message:'Company ID must be a valid positive number',data:[]}}:{id:bulk116Id(value)};
}
export function bulk116Suggest(raw){
 const q=bulk116ParseUrl(raw,new Set(['query','category','sub_category','item_category_id','item_subcategory_id','header_strict','only_with_products']));if(!q)return null;
 const query=q.get('query')??'';if(query.length>100)return null;
 const ids={};for(const key of ['category','sub_category','item_category_id','item_subcategory_id']){
  if(!q.has(key))continue;const id=bulk116Id(q.get(key));if(id===null)return null;ids[key]=id;
 }
 for(const key of ['header_strict','only_with_products'])if(q.has(key)&&!['0','1','true','false'].includes(q.get(key)))return null;
 const normalized_query=query.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
 const tokens=normalized_query.split(' ').filter(w=>w.length>1&&!new Set(['a','an','the','and','or','for','with','to','of','by','on','in','at','from']).has(w));
 return {query,normalized_query,tokens,ids,strict:['1','true'].includes(q.get('header_strict')),withProducts:['1','true'].includes(q.get('only_with_products'))};
}
