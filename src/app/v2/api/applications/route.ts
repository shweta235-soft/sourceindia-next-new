import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {listApplications,createApplications} from '@/lib/localBulk126Applications';
export async function GET(){return listApplications();}
export async function POST(req:NextRequest){return createApplications(req);}
