import type {NextRequest} from 'next/server';
import {privateTicketDownload} from '@/lib/localBulk123TicketDownload';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string,filename:string}>}){
 const {id,filename}=await params;return privateTicketDownload(req,id,filename);
}
