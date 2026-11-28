import type {NextRequest} from 'next/server';
import {membershipPlanToggle} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:C){return membershipPlanToggle(req,(await params).id,'is_delete');}
