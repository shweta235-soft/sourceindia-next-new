import type {NextRequest} from 'next/server';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {bulk102WriteGuard} from '@/lib/localBulk102Http';
export const runtime='nodejs';
export async function DELETE(req:NextRequest){const denied=bulk102WriteGuard(req);if(denied)return denied;
 return adminFaqResponse({message:'Bulk hard deletion disabled to preserve referenced records.'},409);
}
