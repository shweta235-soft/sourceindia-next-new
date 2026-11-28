import type {NextRequest} from 'next/server';
import {removeNewsletterImage} from '@/lib/localBulk145Newsletters';
export const runtime='nodejs';
type Context={params:Promise<{id:string;imageId:string}>};
export async function DELETE(req:NextRequest,{params}:Context){const {id,imageId}=await params;return removeNewsletterImage(req,id,imageId);}
