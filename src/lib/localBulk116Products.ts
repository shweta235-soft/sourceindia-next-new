/** BULK116: eight original-path, public, read-only Express product/company adapters.
 * Original: backend/routes/productsRoutes.js and controllers/productsController.js.
 * Responses are source-shaped where practical, NOT verified 1:1 functional parity.
 * Never expose draft products, unapproved users, PII, or home rotation settings.
 */
import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {
 bulk116Id,bulk116ProductList,bulk116CompanyList,bulk116CompanyProducts,bulk116Suggest,
 bulk116ParseUrl,bulk116Like,
} from '@/lib/localBulk116ProductsContracts.mjs';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const bad=()=>reply({message:'Invalid public product request.'},400);
const unavailable=()=>reply({message:'Local product database unavailable.'},503);
const failure=()=>reply({message:'Product lookup temporarily unavailable.'},503);
type QuerySpec={page:number;limit:number;offset:number;where:string;values:(string|number)[];order:string};
const publicProductJoins=`FROM products p
 INNER JOIN company_info ci ON ci.company_id=p.company_id AND ci.is_delete=0
 INNER JOIN users u ON u.user_id=p.user_id AND u.status=1 AND u.is_delete=0 AND u.is_approve=1
 LEFT JOIN categories cat ON cat.category_id=p.category
 LEFT JOIN sub_categories sub ON sub.sub_category_id=p.sub_category
 LEFT JOIN item_category ic ON ic.item_category_id=p.item_category_id
 LEFT JOIN item_subcategory isc ON isc.item_subcategory_id=p.item_subcategory_id
 LEFT JOIN items it ON it.item_id=p.item_id
 LEFT JOIN upload_images f ON f.upload_image_id=p.file_id
 LEFT JOIN states st ON st.state_id=u.state`;
const productFields=`p.product_id AS id,p.slug,p.title,p.code,p.article_number,p.short_description,p.description,
 p.content,p.quantity,p.category,p.sub_category,p.item_category_id,p.item_subcategory_id,p.item_id,p.keyword_id,
 p.company_id,p.user_id,p.file_id,p.file_ids,p.is_featured,p.is_gold,p.is_recommended,p.best_product,
 p.status,p.is_approve,p.created_at,p.approved_at,
 cat.name AS category_name,sub.name AS sub_category_name,ic.name AS item_category_name,
 isc.name AS item_subcategory_name,it.name AS item_name,ci.organization_name AS company_name,
 ci.organization_slug AS company_slug,ci.company_location,u.fname,u.lname,
 st.name AS state_name,f.file AS file_name`;
const productPublicBase='p.is_delete=0 AND p.status=1 AND p.is_approve=1';
type PublicProduct = Record<string, unknown> & {
 getStatus: 'Public';
 user_full_name: string;
 color_name: null;
};
function normalizeProduct(row:RowDataPacket):PublicProduct{
 const {fname,lname,...product}=row;
 return {...product,getStatus:'Public',user_full_name:[fname,lname].filter(Boolean).join(' '),color_name:null} as PublicProduct;
}
async function getProductRows(db:NonNullable<ReturnType<typeof localAccountDatabase>>,s:QuerySpec){
 const [counts]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${publicProductJoins} WHERE ${s.where}`,s.values);
 const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${productFields} ${publicProductJoins} WHERE ${s.where} ORDER BY ${s.order} LIMIT ? OFFSET ?`,[...s.values,s.limit,s.offset]);
 return {total:Number(counts[0]?.total??0),products:rows.map(normalizeProduct)};
}
export async function bulk116ProductsList(req:Request){
 const spec=bulk116ProductList(req.url);if(!spec)return bad();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{return reply(await getProductRows(db,spec));}catch{return failure();}
}
export async function bulk116CompanyProductTitles(req:Request){
 const spec=bulk116CompanyProducts(req.url);if(!spec)return bad();
 if('error' in spec)return reply(spec.body,spec.error);
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT p.product_id AS id,p.title,p.description
   FROM products p INNER JOIN company_info ci ON ci.company_id=p.company_id AND ci.is_delete=0
   INNER JOIN users u ON u.user_id=p.user_id AND u.status=1 AND u.is_delete=0 AND u.is_approve=1
   WHERE p.company_id=? AND ${productPublicBase} ORDER BY p.product_id DESC LIMIT 200`,[spec.id]);
  return reply({success:true,message:rows.length?'Products fetched successfully':'No products found',data:rows});
 }catch{return reply({success:false,message:'Server error while fetching products',data:[]},503);}
}
export async function bulk116LatestHome(req:Request){
 const q=bulk116ParseUrl(req.url,new Set());if(!q)return bad();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${productFields} ${publicProductJoins}
   WHERE ${productPublicBase} ORDER BY COALESCE(p.approved_at,p.created_at) DESC,p.product_id DESC LIMIT 7`);
  return reply({products:rows.slice(0,6).map(normalizeProduct),refreshed:false,has_more:rows.length>6});
 }catch{return failure();}
}
export async function bulk116FilteredProducts(req:Request){
 const spec=bulk116ProductList(req.url);if(!spec)return bad();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const {products}=await getProductRows(db,spec);
  return reply(products.map((p:ReturnType<typeof normalizeProduct>)=>({id:p.id,title:p.title,user_name:p.user_full_name||'NA',
   category_name:p.category_name||'NA',subcategory_name:p.sub_category_name||'NA',
   company_name:p.company_name||'NA',code:p.code,article_number:p.article_number,
   product_service:'',product_service_name:'',is_gold:Number(p.is_gold)===1?'Yes':'No',
   is_featured:Number(p.is_featured)===1?'Yes':'No',is_recommended:Number(p.is_recommended)===1?'Yes':'No',
   best_product:Number(p.best_product)===1?'Yes':'No',created_at:p.created_at})));
 }catch{return failure();}
}
const companyFields=`ci.company_id AS id,ci.organization_name,ci.organization_slug,ci.company_location,
 ci.brief_company,ci.company_website,ci.organizations_product_description,ci.user_category,
 ci.core_activity,ci.activity,ci.is_verified,ci.is_star_seller,ci.featured_company,
 ci.created_at,logo.file AS company_logo_file,
 (SELECT COUNT(*) FROM products pp INNER JOIN users ux ON ux.user_id=pp.user_id AND ux.status=1 AND ux.is_approve=1 AND ux.is_delete=0
  WHERE pp.company_id=ci.company_id AND pp.status=1 AND pp.is_delete=0 AND pp.is_approve=1) AS product_count`;
const companyFrom=`FROM company_info ci LEFT JOIN upload_images logo ON logo.upload_image_id=ci.company_logo`;
export async function bulk116Companies(req:Request){
 const spec=bulk116CompanyList(req.url);if(!spec)return reply({message:'Invalid public company filters.'},400);
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [counts]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${companyFrom} WHERE ${spec.where}`,spec.values);
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${companyFields} ${companyFrom} WHERE ${spec.where} ORDER BY ${spec.order} LIMIT ? OFFSET ?`,[...spec.values,spec.limit,spec.offset]);
  // Read-only response; no user emails, credentials, phone numbers or unapproved profiles.
  return reply({total:Number(counts[0]?.total??0),companies:rows.map((row:RowDataPacket)=>({...row,category_name:'',sub_category_name:'',item_category_name:'',item_subcategory_name:'',products:[]}))});
 }catch{return failure();}
}
export async function bulk116CompanyDetail(_req:Request,raw:string){
 if(typeof raw!=='string'||(!bulk116Id(raw)&&(!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(raw)||raw.length>160)))return bad();
 const db=localAccountDatabase();if(!db)return unavailable();
 const byId=bulk116Id(raw)!==null;
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${companyFields},u.address,u.zipcode,u.is_seller,u.fname,
    country.name AS country_name,st.name AS state_name,city.name AS city_name
   ${companyFrom}
   INNER JOIN users u ON u.company_id=ci.company_id AND u.is_delete=0 AND u.status=1 AND u.is_approve=1
   LEFT JOIN countries country ON country.country_id=u.country
   LEFT JOIN states st ON st.state_id=u.state
   LEFT JOIN cities city ON city.city_id=u.city
   WHERE ci.is_delete=0 AND ${byId?'ci.company_id':'ci.organization_slug'}=?
   ORDER BY u.user_id ASC LIMIT 1`,[byId?Number(raw):raw]);
  const company=rows[0];if(!company)return reply({message:'Company not found'},404);
  const [products]=await db.execute<RowDataPacket[]>(`SELECT p.product_id AS id,p.slug,p.title,f.file AS image
   FROM products p INNER JOIN users u ON u.user_id=p.user_id AND u.is_delete=0 AND u.status=1 AND u.is_approve=1
   LEFT JOIN upload_images f ON f.upload_image_id=p.file_id
   WHERE p.company_id=? AND ${productPublicBase} ORDER BY p.product_id DESC LIMIT 30`,[company.id]);
  const [related]=await db.execute<RowDataPacket[]>(`SELECT ci.company_id AS id,ci.organization_name,ci.organization_slug,logo.file AS company_logo_file
   ${companyFrom} WHERE ci.company_id<>? AND ci.is_delete=0
   AND EXISTS (SELECT 1 FROM users u WHERE u.company_id=ci.company_id AND u.status=1 AND u.is_approve=1 AND u.is_delete=0)
   ORDER BY ci.company_id DESC LIMIT 12`,[company.id]);
  const {fname,...safeCompany}=company;
  return reply({...safeCompany,coreactivity_name:null,activity_name:null,category_name:'',sub_category_name:'',
   user:{fname},products,recommended_companies:related});
 }catch{return failure();}
}
export async function bulk116ProductDetail(_req:Request,raw:string){
 if(typeof raw!=='string'||(!bulk116Id(raw)&&(!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(raw)||raw.length>160)))return bad();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${productFields},ci.brief_company,ci.organizations_product_description,
    logo.file AS company_logo ${publicProductJoins}
    LEFT JOIN upload_images logo ON logo.upload_image_id=ci.company_logo
    WHERE ${productPublicBase} AND ${bulk116Id(raw)!==null?'p.product_id':'p.slug'}=? LIMIT 1`,[bulk116Id(raw)??raw]);
  const p=rows[0];if(!p)return reply({message:'Product not found'},404);
  const ids=String(p.file_ids||'').split(',').map(x=>bulk116Id(x.trim())).filter((x):x is number=>x!==null).slice(0,30);
  let images:RowDataPacket[]=[];
  if(ids.length){const [found]=await db.execute<RowDataPacket[]>(`SELECT upload_image_id AS id,file FROM upload_images WHERE upload_image_id IN (${ids.map(()=>'?').join(',')})`,ids);
   const m=new Map(found.map((row:RowDataPacket)=>[Number(row.id),row]));images=ids.map(id=>m.get(id)).filter((row):row is RowDataPacket=>Boolean(row));}
  const [rating]=await db.execute<RowDataPacket[]>(`SELECT AVG(rating) AS averageRating,COUNT(*) AS reviews_count FROM review_ratings WHERE product_id=?`,[p.id]);
  const [similar]=await db.execute<RowDataPacket[]>(`SELECT other.product_id AS id,other.title,other.slug,im.file AS file_name
    FROM products other INNER JOIN users us ON us.user_id=other.user_id AND us.status=1 AND us.is_delete=0 AND us.is_approve=1
    INNER JOIN company_info c2 ON c2.company_id=other.company_id AND c2.is_delete=0
    LEFT JOIN upload_images im ON im.upload_image_id=other.file_id
    WHERE other.product_id<>? AND other.status=1 AND other.is_approve=1 AND other.is_delete=0
    AND ${p.item_subcategory_id?'other.item_subcategory_id=?':'other.category=?'} ORDER BY other.product_id DESC LIMIT 12`,[p.id,p.item_subcategory_id||p.category]);
  return reply({id:p.id,company_id:p.company_id,title:p.title,file_name:p.file_name,images,
   averageRating:Number(rating[0]?.averageRating??0),reviews_count:Number(rating[0]?.reviews_count??0),
   category_name:p.category_name,sub_category_name:p.sub_category_name,item_category_name:p.item_category_name,
   item_subcategory_name:p.item_subcategory_name,short_description:p.short_description,company_slug:p.company_slug,
   company_logo:p.company_logo,company_location:p.company_location,created_at:p.created_at,
   core_activity_name:null,description:p.description,company_name:p.company_name,activity_name:null,
   brief_company:p.brief_company,organizations_product_description:p.description,similar_products:similar});
 }catch{return failure();}
}
export async function bulk116SuggestProducts(req:Request){
 const data=bulk116Suggest(req.url);if(!data)return reply({success:false,message:'Invalid suggestion filters',data:[]},400);
 const empty=(reason:string)=>reply({success:true,normalized_query:data.normalized_query,tokens:data.tokens,data:[],
  auto_classification:{matched:false,reason,bucket:'Others / Uncategorized'},alternatives:[]});
 if(data.query.length<2)return empty('query_too_short');
 if(!data.tokens.length)return empty('no_meaningful_tokens');
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const where=['pk.status=1','isc.status=1','isc.is_delete=0'];const values:(string|number)[]=[];
  const ids=data.ids as Record<string,number>;
  for(const [k,col] of [['category','isc.category_id'],['sub_category','isc.subcategory_id'],['item_category_id','isc.item_category_id'],['item_subcategory_id','isc.item_subcategory_id']] as const){
   if(ids[k]!==undefined){where.push(`${col}=?`);values.push(ids[k]);}
  }
  if(data.withProducts)where.push(`EXISTS (SELECT 1 FROM products p INNER JOIN users u ON u.user_id=p.user_id AND u.status=1 AND u.is_approve=1 AND u.is_delete=0
   WHERE p.keyword_id=pk.product_keyword_id AND p.status=1 AND p.is_delete=0 AND p.is_approve=1)`);
  where.push(`(${data.tokens.map(()=>`pk.name LIKE ? ESCAPE '!'`).join(' OR ')})`);
  for(const token of data.tokens)values.push(bulk116Like(token));
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT pk.product_keyword_id AS id,pk.name AS title,pk.item_subcategory_id,
   isc.category_id AS category,cat.name AS category_name,isc.subcategory_id AS sub_category,sub.name AS sub_category_name,
   isc.item_category_id,ic.name AS item_category_name,isc.name AS item_subcategory_name
   FROM product_keywords pk INNER JOIN item_subcategory isc ON isc.item_subcategory_id=pk.item_subcategory_id
   LEFT JOIN categories cat ON cat.category_id=isc.category_id
   LEFT JOIN sub_categories sub ON sub.sub_category_id=isc.subcategory_id
   LEFT JOIN item_category ic ON ic.item_category_id=isc.item_category_id
   WHERE ${where.join(' AND ')} ORDER BY pk.product_keyword_id DESC LIMIT 180`,values);
  const tokens=data.tokens;
  const suggestions=rows.map((x:RowDataPacket)=>{
   const name=String(x.title).toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
   const matched=tokens.filter(t=>name.includes(t));
   const exact=name===data.normalized_query, prefix=name.startsWith(data.normalized_query),
    confidence=exact?1:Number((matched.length/tokens.length).toFixed(3));
   return {...x,title:String(x.title??''),user_id:null,item_id:null,item_name:'',match_score:matched.length*100+(prefix?30:0),
    confidence_score:confidence,exact_match:exact,phrase_prefix_match:prefix,phrase_includes_match:name.includes(data.normalized_query),
    matched_words:matched,matched_query_words:matched,matched_query_word_count:matched.length,
    query_word_count:tokens.length,full_query_match:matched.length===tokens.length,
    is_confident_match:exact||(matched.length>=2&&tokens.length>=2)};
  }).sort((a,b)=>Number(b.full_query_match)-Number(a.full_query_match)||Number(b.exact_match)-Number(a.exact_match)||b.match_score-a.match_score||String(a.title).length-String(b.title).length)
   .slice(0,data.strict?15:6);
  const best=suggestions.find((x:{is_confident_match:boolean})=>x.is_confident_match)??(data.strict?suggestions[0]:undefined);
  return reply({success:true,normalized_query:data.normalized_query,tokens:data.tokens,data:suggestions,
   auto_classification:best?{matched:true,reason:best.exact_match?'exact_match':'best_score_match',best_match:best}:
    {matched:false,reason:suggestions.length?'low_confidence':'no_keyword_match',bucket:'Others / Uncategorized'},
   alternatives:suggestions.filter((x:RowDataPacket)=>x!==best)});
 }catch{return reply({success:false,message:'Suggestion lookup unavailable',data:[]},503);}
}
