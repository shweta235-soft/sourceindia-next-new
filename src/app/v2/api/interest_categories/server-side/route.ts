import type {NextRequest} from 'next/server';
import {interestCategoriesServerSide} from '@/lib/localBulk143InterestCategories';
export const runtime='nodejs';
export function GET(req:NextRequest){return interestCategoriesServerSide(req);}
