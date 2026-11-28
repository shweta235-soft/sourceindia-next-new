import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {statusKnowledge} from '@/lib/localBulk125KnowledgeCenter';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){return statusKnowledge(req,(await params).id,'is_delete');}
