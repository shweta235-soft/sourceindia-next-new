import type {NextRequest} from 'next/server';
import {membershipPlanServerSide} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
export function GET(req:NextRequest){return membershipPlanServerSide(req);}
