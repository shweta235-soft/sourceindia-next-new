import type {NextRequest} from 'next/server';
import {getNewsletter,updateNewsletter,deleteNewsletter} from '@/lib/localBulk145Newsletters';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,{params}:Context){const {id}=await params;return getNewsletter(id);}
export async function PUT(req:NextRequest,{params}:Context){const {id}=await params;return updateNewsletter(req,id);}
export async function DELETE(req:NextRequest,{params}:Context){const {id}=await params;return deleteNewsletter(req,id);}
