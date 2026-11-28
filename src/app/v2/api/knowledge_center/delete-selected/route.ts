import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {bulkDeleteKnowledge} from '@/lib/localBulk125KnowledgeCenter';
export async function DELETE(req:NextRequest){return bulkDeleteKnowledge(req);}
