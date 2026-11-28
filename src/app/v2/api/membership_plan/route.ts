import type {NextRequest} from 'next/server';
import {listMembershipPlans,createMembershipPlan} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
export function GET(){return listMembershipPlans();}
export function POST(req:NextRequest){return createMembershipPlan(req);}
