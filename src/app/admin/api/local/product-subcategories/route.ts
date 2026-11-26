import { bulk107Handle } from '@/lib/localBulk107Writes';
import type { NextRequest } from 'next/server';
import { bulk106Handle } from '@/lib/localBulk106Admin';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){return bulk106Handle(req,'product-subcategories','list');}

export async function POST(req:NextRequest){return bulk107Handle(req,'product-subcategories','create');}
