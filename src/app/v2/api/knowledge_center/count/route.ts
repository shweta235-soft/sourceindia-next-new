import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {countKnowledge} from '@/lib/localBulk125KnowledgeCenter';
export async function GET(){return countKnowledge();}
