import type {NextRequest} from 'next/server';
import {appendNewsletterImages} from '@/lib/localBulk145Newsletters';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function POST(req:NextRequest,{params}:Context){const {id}=await params;return appendNewsletterImages(req,id);}
