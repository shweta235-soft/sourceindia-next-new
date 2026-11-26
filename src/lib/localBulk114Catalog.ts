/** SourceIndia catalog taxonomy: read-only, active-only bounded local APIs.
 * Original sources: backend/routes/{subCategory,itemCategory,itemSubCategory,items,keywords}Routes.js
 * and corresponding Sequelize models/controllers. Not a drop-in Express response contract.
 */
import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK114_FAMILIES,bulk114Id,bulk114Parse,bulk114SearchTerm,bulk114Sql} from '@/lib/localBulk114Contracts.mjs';
export type CatalogFamily='subcategories'|'item-categories'|'item-subcategories'|'items'|'product-keywords';
export type CatalogKind='list'|'count'|'detail';
export type CatalogRouteParams=Record<string,string>;
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const invalid=()=>reply({message:'Invalid catalog request.'},400);

export async function bulk114Catalog(req:Request,family:CatalogFamily,kind:CatalogKind,fixed:CatalogRouteParams={}) {
  if(!BULK114_FAMILIES[family])return reply({message:'Unknown catalog resource.'},404);
  const parsed=bulk114Parse(req.url,family,fixed,kind);
  if(!parsed)return invalid();
  let id:number|null=null;
  if(kind==='detail'){
    id=bulk114Id(fixed.id);
    if(id===null)return invalid();
    if(Object.keys(parsed.filters).length||parsed.q!==null)return invalid();
  }
  const query=bulk114Sql(family,kind,parsed,id);
  if(!query)return invalid();
  const db=localAccountDatabase();if(!db)return reply({message:'Local database not configured.'},503);
  try{
    const [rows]=await db.execute<RowDataPacket[]>(query.sql,query.values);
    if(kind==='count')return reply({total:Number(rows[0]?.total??0)});
    if(kind==='detail')return rows.length?reply({data:rows[0]}):reply({message:'Catalog record not found.'},404);
    const count=bulk114Sql(family,'count',parsed);
    if(!count)return invalid();
    const [totals]=await db.execute<RowDataPacket[]>(count.sql,count.values);
    return reply({data:rows,pagination:{page:parsed.page,limit:parsed.limit,total:Number(totals[0]?.total??0)}});
  }catch{return reply({message:'Catalog lookup temporarily unavailable.'},503);}
}

export async function bulk114Summary(req:Request){
  const u=new URL(req.url);
  if([...u.searchParams.keys()].length)return invalid();
  const db=localAccountDatabase();if(!db)return reply({message:'Local database not configured.'},503);
  try{
    const counts:Record<string,number>={};
    for(const family of ['subcategories','item-categories','item-subcategories','items','product-keywords'] as CatalogFamily[]){
      const parsed=bulk114Parse(req.url,family,{},'count');
      if(!parsed)return invalid();
      const q=bulk114Sql(family,'count',parsed);
      if(!q)return invalid();
      const [r]=await db.execute<RowDataPacket[]>(q.sql,q.values);
      counts[family]=Number(r[0]?.total??0);
    }
    return reply({counts});
  }catch{return reply({message:'Catalog summary temporarily unavailable.'},503);}
}

/** Search only active taxonomy rows, five bounded 10-row lists, never unbounded DB scan outputs. */
export async function bulk114Search(req:Request){
  const u=new URL(req.url);const keys=[...u.searchParams.keys()];
  if(keys.length!==1 || keys[0]!=='q'||u.searchParams.getAll('q').length!==1)return invalid();
  const term=bulk114SearchTerm(u.searchParams.get('q'));
  if(!term)return invalid();
  const db=localAccountDatabase();if(!db)return reply({message:'Local database not configured.'},503);
  try{
    const data:Record<string,RowDataPacket[]>={};
    for(const family of ['subcategories','item-categories','item-subcategories','items','product-keywords'] as CatalogFamily[]){
      const parsed=bulk114Parse(`http://local.invalid/catalog?q=${encodeURIComponent(term)}&limit=10`,family);
      const query=parsed?bulk114Sql(family,'list',parsed):null;
      if(!query)return invalid();
      const [rows]=await db.execute<RowDataPacket[]>(query.sql,query.values);
      data[family]=rows;
    }
    return reply({query:term,data});
  }catch{return reply({message:'Catalog search temporarily unavailable.'},503);}
}
