import type {NextRequest} from 'next/server';
import {listShortcuts,createShortcut} from '@/lib/localBulk135Shortcuts';
export const runtime='nodejs';
export async function GET(req:NextRequest){return listShortcuts(req);}
export async function POST(req:NextRequest){return createShortcut(req);}
