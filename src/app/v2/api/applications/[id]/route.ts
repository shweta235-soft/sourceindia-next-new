import type {NextRequest} from 'next/server';
export const runtime='nodejs';
import {detailApplications,updateApplications,deleteApplications} from '@/lib/localBulk126Applications';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:C){return detailApplications((await params).id);}
export async function PUT(req:NextRequest,{params}:C){return updateApplications(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:C){return deleteApplications(req,(await params).id);}
