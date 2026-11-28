import {membershipPlanCount} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
export function GET(){return membershipPlanCount();}
