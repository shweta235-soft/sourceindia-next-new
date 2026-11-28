import type {NextRequest} from 'next/server';
import {deleteSelectedMembershipPlans} from '@/lib/localBulk141MembershipPlans';
export const runtime='nodejs';
export function DELETE(req:NextRequest){return deleteSelectedMembershipPlans(req);}
