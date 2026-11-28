import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {countApplications,deleteCountApplications} from '@/lib/localBulk126Applications';
export async function GET(){return countApplications();}
export async function DELETE(req:NextRequest){return deleteCountApplications(req);}
