import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {detailKnowledge,updateKnowledge,deleteKnowledge} from '@/lib/localBulk125KnowledgeCenter';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:C){return detailKnowledge((await params).id);}
export async function PUT(req:NextRequest,{params}:C){return updateKnowledge(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:C){return deleteKnowledge(req,(await params).id);}
