import type {NextRequest} from 'next/server';
import {bulk115KeywordsForSubcategory} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){const {id}=await ctx.params;return bulk115KeywordsForSubcategory(req,id);}
