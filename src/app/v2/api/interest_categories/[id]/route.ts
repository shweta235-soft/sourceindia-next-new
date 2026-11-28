import type {NextRequest} from 'next/server';
import {getInterestCategory,updateInterestCategory,deleteInterestCategory} from '@/lib/localBulk143InterestCategories';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:C){return getInterestCategory((await params).id);}
export async function PUT(req:NextRequest,{params}:C){return updateInterestCategory(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:C){return deleteInterestCategory(req,(await params).id);}
