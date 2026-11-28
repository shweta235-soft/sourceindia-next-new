import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {listKnowledge,createKnowledge} from '@/lib/localBulk125KnowledgeCenter';
export async function GET(){return listKnowledge();}
export async function POST(req:NextRequest){return createKnowledge(req);}
