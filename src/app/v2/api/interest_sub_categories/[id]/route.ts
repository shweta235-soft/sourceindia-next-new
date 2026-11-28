import type {NextRequest} from 'next/server';
import {getInterestSubcategory,updateInterestSubcategory,deleteInterestSubcategory} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:Context){return getInterestSubcategory((await params).id);}
export async function PUT(req:NextRequest,{params}:Context){return updateInterestSubcategory(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:Context){return deleteInterestSubcategory(req,(await params).id);}
