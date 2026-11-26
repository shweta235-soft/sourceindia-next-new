import type {NextRequest} from 'next/server';
import {bulk115AdminList} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk115AdminList(req,'item-categories','active',[]);}
