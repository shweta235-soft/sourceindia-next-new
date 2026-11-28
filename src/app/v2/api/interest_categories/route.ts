import type {NextRequest} from 'next/server';
import {listInterestCategories,createInterestCategory} from '@/lib/localBulk143InterestCategories';
export const runtime='nodejs';
export function GET(){return listInterestCategories();}
export function POST(req:NextRequest){return createInterestCategory(req);}
