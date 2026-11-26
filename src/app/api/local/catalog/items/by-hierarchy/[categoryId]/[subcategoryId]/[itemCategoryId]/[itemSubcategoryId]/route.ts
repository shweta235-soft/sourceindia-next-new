import {bulk114Catalog} from '@/lib/localBulk114Catalog';
export const runtime='nodejs';
export async function GET(req:Request, {params}:{params:Promise<Record<string,string>>}){
 const p=await params;
 return bulk114Catalog(req,'items','list',{categoryId:p.categoryId, subcategoryId:p.subcategoryId, itemCategoryId:p.itemCategoryId, itemSubcategoryId:p.itemSubcategoryId});
}
