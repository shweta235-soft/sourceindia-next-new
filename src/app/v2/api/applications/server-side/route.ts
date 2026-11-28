import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {gridApplications} from '@/lib/localBulk126Applications';
export async function GET(req:NextRequest){return gridApplications(req);}
