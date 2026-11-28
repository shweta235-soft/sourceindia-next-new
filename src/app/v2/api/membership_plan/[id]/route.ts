import type {NextRequest} from 'next/server';
import {getMembershipPlan,updateMembershipPlan,deleteMembershipPlan} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:C){return getMembershipPlan((await params).id);}
export async function PUT(req:NextRequest,{params}:C){return updateMembershipPlan(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:C){return deleteMembershipPlan(req,(await params).id);}
