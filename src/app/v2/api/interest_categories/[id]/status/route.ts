import type {NextRequest} from 'next/server';
import {updateInterestCategoryStatus} from '@/lib/localBulk143InterestCategories';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){return updateInterestCategoryStatus(req,(await params).id);}
