import type {NextRequest} from 'next/server';
import {updateContactDeleteStatus} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){return updateContactDeleteStatus(req,(await params).id);}
