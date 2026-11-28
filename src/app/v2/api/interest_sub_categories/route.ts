import type {NextRequest} from 'next/server';
import {listInterestSubcategories,createInterestSubcategory} from '@/lib/localBulk144InterestSubcategories';
export const runtime='nodejs';
export function GET(){return listInterestSubcategories();}
export function POST(req:NextRequest){return createInterestSubcategory(req);}
