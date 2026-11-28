import type {NextRequest} from 'next/server';
import {deleteContact} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function DELETE(req:NextRequest,{params}:C){return deleteContact(req,(await params).id);}
