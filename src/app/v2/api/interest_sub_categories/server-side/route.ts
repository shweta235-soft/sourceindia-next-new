import type {NextRequest} from 'next/server';
import {interestSubcategoriesServerSide} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
export function GET(req:NextRequest){return interestSubcategoriesServerSide(req);}
