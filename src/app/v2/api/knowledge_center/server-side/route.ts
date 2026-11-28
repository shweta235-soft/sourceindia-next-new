import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {gridKnowledge} from '@/lib/localBulk125KnowledgeCenter';
export async function GET(req:NextRequest){return gridKnowledge(req);}
