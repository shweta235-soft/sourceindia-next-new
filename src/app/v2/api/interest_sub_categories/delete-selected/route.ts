import type {NextRequest} from 'next/server';
import {deleteSelectedInterestSubcategories} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
export function DELETE(req:NextRequest){return deleteSelectedInterestSubcategories(req);}
