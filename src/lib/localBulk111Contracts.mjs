/** Pure validation and result shaping for authenticated buyer-owned dashboard APIs. */
export const bulk111Id = value => {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      !/^[1-9]\d{0,9}$/.test(String(value))) return null;
  const n=Number(value);
  return Number.isSafeInteger(n)&&n<=2147483647?n:null;
};
export function bulk111Query(params, owner, allowed=[]) {
  if (!(params instanceof URLSearchParams) || bulk111Id(owner)===null) return null;
  const allow=new Set(['userId',...allowed]);
  for (const key of params.keys()) if (!allow.has(key)||params.getAll(key).length!==1) return null;
  const supplied=params.get('userId');
  if(supplied!==null&&bulk111Id(supplied)===null)return null;
  if(supplied!==null&&bulk111Id(supplied)!==owner)return {forbidden:true};
  const category=allowed.includes('categoryId')?bulk111Id(params.get('categoryId')):undefined;
  if(allowed.includes('categoryId')&&category===null)return null;
  return {userId:owner,...(category===undefined?{}:{categoryId:category})};
}
const plain=value=>{
 if(value===null||typeof value!=='object'||Array.isArray(value))return false;
 const proto=Object.getPrototypeOf(value);
 // Accept plain JSON objects across Node vm realms; reject custom prototypes.
 return proto!==null&&(proto===Object.prototype||Object.getPrototypeOf(proto)===null);
};
export function bulk111InterestBody(input, owner){
 if(!plain(input)||!Object.keys(input).every(k=>['userId','activity'].includes(k))||bulk111Id(input.userId)!==owner||!plain(input.activity))return null;
 const entries=Object.entries(input.activity);if(!entries.length||entries.length>50)return null;
 const pairs=[];
 for(const [category,ids] of entries){
  const cat=bulk111Id(category);
  if(!cat||!Array.isArray(ids)||!ids.length||ids.length>100)return null;
  const parsed=ids.map(bulk111Id);if(parsed.some(v=>v===null)||new Set(parsed).size!==parsed.length)return null;
  for(const id of parsed)pairs.push([cat,id]);
 }
 return pairs.length<=120?{userId:owner,pairs}:null;
}
export function bulk111SourcingBody(input,owner){
 if(!plain(input)||!Object.keys(input).every(k=>['userId','activity'].includes(k))||bulk111Id(input.userId)!==owner||!plain(input.activity))return null;
 const a=input.activity;if(!Object.keys(a).every(k=>['category_id','subcategory_ids','action'].includes(k)))return null;
 const categoryId=bulk111Id(a.category_id);
 if(!categoryId||!Array.isArray(a.subcategory_ids)||a.subcategory_ids.length<1||a.subcategory_ids.length>100)return null;
 const ids=a.subcategory_ids.map(bulk111Id);
 if(ids.some(v=>v===null)||new Set(ids).size!==ids.length)return null;
 const action=a.action===undefined?'replace':a.action;
 if(!['add','remove','replace'].includes(action))return null;
 return {userId:owner,categoryId,ids,action};
}
export function bulk111InterestTree(categories,subs,rows=[]){
 const subCategories=Object.create(null),checked=Object.create(null);
 for(const c of categories)subCategories[String(c.id)]=[];
 for(const s of subs)if(Object.hasOwn(subCategories,String(s.interest_category_id)))subCategories[String(s.interest_category_id)].push(s);
 for(const row of rows){const key=String(row.core_activity_id);if(!Object.hasOwn(checked,key))checked[key]=[];checked[key].push(Number(row.activity_id));}
 return {categories,subCategories,checked};
}
export function bulk111ItemTree(categories,groups,items,counts){
 const tally=new Map(counts.map(x=>[Number(x.item_category_id),Number(x.count)||0]));
 const children=new Map();for(const item of items){const key=Number(item.subcategory_id);if(!children.has(key))children.set(key,[]);children.get(key).push({...item,count:tally.get(Number(item.id))||0});}
 const byCategory=new Map();for(const group of groups){const cats=children.get(Number(group.id))||[];if(!cats.length)continue;const key=Number(group.category);if(!byCategory.has(key))byCategory.set(key,[]);byCategory.get(key).push({...group,categories:cats});}
 return {categories:categories.map(c=>({...c,groups:byCategory.get(Number(c.id))||[]})).filter(c=>c.groups.length>0)};
}
export function bulk111MarkChecked(rows){
 const subcategories=rows.map(x=>({id:x.id,name:x.name,slug:x.slug,item_category_id:x.item_category_id,category_id:x.category_id,subcategory_id:x.subcategory_id,checked:Number(x.checked)>0}));
 return {subcategories,checkedCount:subcategories.filter(x=>x.checked).length};
}
