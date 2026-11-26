/**
 * Bulk114: read-only, active-only SourceIndia catalog taxonomy SQL contracts.
 * Grounded in backend/models/{SubCategories,ItemCategory,ItemSubCategory,Items,ProductKeyword}.js.
 * Uses immutable table/column allowlists; never interpolates caller input into SQL.
 * Public-facing results intentionally exclude deleted/inactive entities and their ancestors.
 */
export const BULK114_FAMILIES = Object.freeze({
  'subcategories': Object.freeze({
    from: `FROM sub_categories sc
      INNER JOIN categories c ON c.category_id=sc.category AND c.status=1 AND c.is_delete=0`,
    select: `sc.sub_category_id AS id, sc.uuid, sc.name, sc.slug, sc.category AS category_id,
      sc.file_id, c.name AS category_name`,
    where: 'sc.status=1 AND sc.is_delete=0',
    filters: Object.freeze({categoryId:'sc.category'}),
    search: 'sc.name',
    sort: 'sc.sub_category_id',
    detailId: 'sc.sub_category_id',
  }),
  'item-categories': Object.freeze({
    from: `FROM item_category ic
      INNER JOIN categories c ON c.category_id=ic.category_id AND c.status=1 AND c.is_delete=0
      INNER JOIN sub_categories sc ON sc.sub_category_id=ic.subcategory_id AND sc.category=c.category_id
        AND sc.status=1 AND sc.is_delete=0`,
    select: `ic.item_category_id AS id, ic.uuid, ic.name, ic.slug, ic.file_id, ic.category_id,
      ic.subcategory_id, c.name AS category_name, sc.name AS subcategory_name`,
    where: 'ic.status=1 AND ic.is_delete=0',
    filters: Object.freeze({categoryId:'ic.category_id',subcategoryId:'ic.subcategory_id'}),
    search: 'ic.name',
    sort: 'ic.item_category_id',
    detailId: 'ic.item_category_id',
  }),
  'item-subcategories': Object.freeze({
    from: `FROM item_subcategory isc
      INNER JOIN item_category ic ON ic.item_category_id=isc.item_category_id AND ic.status=1 AND ic.is_delete=0
        AND ic.category_id=isc.category_id AND ic.subcategory_id=isc.subcategory_id
      INNER JOIN categories c ON c.category_id=isc.category_id AND c.status=1 AND c.is_delete=0
      INNER JOIN sub_categories sc ON sc.sub_category_id=isc.subcategory_id AND sc.category=c.category_id
        AND sc.status=1 AND sc.is_delete=0`,
    select: `isc.item_subcategory_id AS id, isc.uuid, isc.name, isc.slug, isc.file_id,
      isc.category_id, isc.subcategory_id, isc.item_category_id,
      c.name AS category_name, sc.name AS subcategory_name, ic.name AS itemcategory_name`,
    where: 'isc.status=1 AND isc.is_delete=0',
    filters: Object.freeze({categoryId:'isc.category_id',subcategoryId:'isc.subcategory_id',itemCategoryId:'isc.item_category_id'}),
    search: 'isc.name',
    sort: 'isc.item_subcategory_id',
    detailId: 'isc.item_subcategory_id',
  }),
  'items': Object.freeze({
    from: `FROM items i
      INNER JOIN item_subcategory isc ON isc.item_subcategory_id=i.item_sub_category_id
        AND isc.status=1 AND isc.is_delete=0
        AND isc.category_id=i.category_id AND isc.subcategory_id=i.subcategory_id
        AND isc.item_category_id=i.item_category_id
      INNER JOIN item_category ic ON ic.item_category_id=i.item_category_id AND ic.status=1 AND ic.is_delete=0
        AND ic.category_id=i.category_id AND ic.subcategory_id=i.subcategory_id
      INNER JOIN categories c ON c.category_id=i.category_id AND c.status=1 AND c.is_delete=0
      INNER JOIN sub_categories sc ON sc.sub_category_id=i.subcategory_id AND sc.category=c.category_id
        AND sc.status=1 AND sc.is_delete=0`,
    select: `i.item_id AS id, i.uuid, i.name, i.slug, i.file_id,
      i.category_id, i.subcategory_id, i.item_category_id, i.item_sub_category_id,
      c.name AS category_name, sc.name AS subcategory_name,
      ic.name AS itemcategory_name, isc.name AS item_subcategory_name`,
    where: 'i.status=1 AND i.is_delete=0',
    filters: Object.freeze({categoryId:'i.category_id',subcategoryId:'i.subcategory_id',itemCategoryId:'i.item_category_id',itemSubcategoryId:'i.item_sub_category_id'}),
    search: 'i.name',
    sort: 'i.item_id',
    detailId: 'i.item_id',
  }),
  'product-keywords': Object.freeze({
    from: `FROM product_keywords pk
      INNER JOIN item_subcategory isc ON isc.item_subcategory_id=pk.item_subcategory_id
        AND isc.status=1 AND isc.is_delete=0
      INNER JOIN item_category ic ON ic.item_category_id=isc.item_category_id AND ic.status=1 AND ic.is_delete=0
        AND ic.category_id=isc.category_id AND ic.subcategory_id=isc.subcategory_id
      INNER JOIN categories c ON c.category_id=isc.category_id AND c.status=1 AND c.is_delete=0
      INNER JOIN sub_categories sc ON sc.sub_category_id=isc.subcategory_id AND sc.category=c.category_id
        AND sc.status=1 AND sc.is_delete=0`,
    select: `pk.product_keyword_id AS id, pk.name, pk.is_main, pk.item_subcategory_id,
      isc.name AS item_subcategory_name`,
    where: 'pk.status=1',
    filters: Object.freeze({itemSubcategoryId:'pk.item_subcategory_id'}),
    search: 'pk.name',
    sort: 'pk.product_keyword_id',
    detailId: 'pk.product_keyword_id',
  }),
});

export function bulk114Id(value) {
  if(typeof value!=='string'|| !/^[1-9][0-9]{0,8}$/.test(value))return null;
  const n=Number(value);return Number.isSafeInteger(n)?n:null;
}
const FIELDS = ['categoryId','subcategoryId','itemCategoryId','itemSubcategoryId'];
/** Query parsing disallows duplicates, unknown params, empty values and unbounded pagination. */
export function bulk114Parse(url, family, fixed={}, mode='list') {
  let parsed;try{parsed=new URL(url);}catch{return null;}
  const cfg=BULK114_FAMILIES[family];if(!cfg)return null;
  if(mode==='detail' && [...parsed.searchParams.keys()].length)return null;
  const allowed=new Set([...Object.keys(cfg.filters), 'page', 'limit', 'q', ...Object.keys(fixed)]);
  for(const [key,val] of parsed.searchParams) {
    if(!allowed.has(key) || parsed.searchParams.getAll(key).length>1 || !val) return null;
    if(Object.hasOwn(fixed,key))return null; // The URL must not override route params.
  }
  const filterValues={};
  for(const key of FIELDS){
    if(!(key in cfg.filters))continue;
    const raw=key in fixed ? fixed[key] : parsed.searchParams.get(key);
    if(raw===null||raw===undefined)continue;
    const id=bulk114Id(String(raw));if(id===null)return null;
    filterValues[key]=id;
  }
  const pageRaw=parsed.searchParams.get('page')??'1';
  const limitRaw=parsed.searchParams.get('limit')??'20';
  if(!/^[1-9][0-9]{0,5}$/.test(pageRaw) || !/^[1-9][0-9]{0,2}$/.test(limitRaw))return null;
  const page=Number(pageRaw),limit=Number(limitRaw);
  if(limit>50||page>1000||!Number.isSafeInteger((page-1)*limit))return null;
  const qRaw=parsed.searchParams.get('q');
  if(mode==='count' && (parsed.searchParams.has('page')||parsed.searchParams.has('limit')))return null;
  if(qRaw!==null && (qRaw.trim().length<3||qRaw.trim().length>60||!/^[-\p{L}\p{M}\p{N} .,_()]+$/u.test(qRaw)))return null;
  return {page,limit,offset:(page-1)*limit,q:qRaw?.trim()??null, filters:filterValues};
}
export function bulk114Sql(family, kind, parsed, id=null) {
  const cfg=BULK114_FAMILIES[family];if(!cfg||!parsed)return null;
  if(!['list','count','detail'].includes(kind))return null;
  const clauses=[cfg.where], values=[];
  for(const [key,column] of Object.entries(cfg.filters)) {
    if(parsed.filters[key]!==undefined){clauses.push(`${column}=?`);values.push(parsed.filters[key]);}
  }
  if(parsed.q!==null){clauses.push(`${cfg.search} LIKE ?`);values.push(`%${parsed.q}%`);}
  if(kind==='detail'){
    const checked=typeof id==='number'&&Number.isSafeInteger(id)&&id>0?id:null;
    if(checked===null)return null;
    clauses.push(`${cfg.detailId}=?`);values.push(checked);
  }
  const sql=`SELECT ${kind==='count'?'COUNT(*) AS total':cfg.select} ${cfg.from} WHERE ${clauses.join(' AND ')}`;
  if(kind==='count')return {sql,values};
  if(kind==='detail')return {sql:`${sql} LIMIT 1`, values};
  return {sql:`${sql} ORDER BY ${cfg.sort} ASC LIMIT ? OFFSET ?`, values:[...values,parsed.limit,parsed.offset]};
}

export function bulk114SearchTerm(raw) {
  if(typeof raw!=='string')return null;
  const term=raw.trim();
  return term.length>=3 && term.length<=60 && /^[-\p{L}\p{M}\p{N} .,_()]+$/u.test(term)?term:null;
}
