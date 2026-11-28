import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {patchApplications} from '@/lib/localBulk126Applications';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){return patchApplications(req,(await params).id,'status');}
