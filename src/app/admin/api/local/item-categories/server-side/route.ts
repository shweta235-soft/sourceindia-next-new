import type { NextRequest } from 'next/server';
import { bulk106Handle } from '@/lib/localBulk106Admin';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){return bulk106Handle(req,'item-categories','serverSide');}
