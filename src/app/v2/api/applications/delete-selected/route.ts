import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {deleteSelectedApplications} from '@/lib/localBulk126Applications';
export async function DELETE(req:NextRequest){return deleteSelectedApplications(req);}
