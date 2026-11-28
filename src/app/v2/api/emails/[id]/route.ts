import type {NextRequest} from 'next/server';
import {getEmail,updateEmail,deleteEmail} from '@/lib/localBulk142Emails';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:Context){return getEmail((await params).id);}
export async function PUT(req:NextRequest,{params}:Context){return updateEmail(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:Context){return deleteEmail(req,(await params).id);}
