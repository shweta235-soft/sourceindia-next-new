import type {NextRequest} from 'next/server';
import {updateInterestSubcategoryStatus} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Context){return updateInterestSubcategoryStatus(req,(await params).id);}
