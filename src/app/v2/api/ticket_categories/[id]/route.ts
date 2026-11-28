import type {NextRequest} from 'next/server';
import {getCategoryDetail,updateCategory,deleteCategory} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:C){return getCategoryDetail((await params).id);}
export async function PUT(req:NextRequest,{params}:C){return updateCategory(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:C){return deleteCategory(req,(await params).id);}
