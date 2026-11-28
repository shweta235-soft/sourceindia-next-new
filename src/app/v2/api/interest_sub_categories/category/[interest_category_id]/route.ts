import type {NextRequest} from 'next/server';
import {interestSubcategoriesByCategory} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
type Context={params:Promise<{interest_category_id:string}>};
export async function GET(_req:NextRequest,{params}:Context){return interestSubcategoriesByCategory((await params).interest_category_id);}
