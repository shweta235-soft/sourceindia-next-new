import type { NextRequest } from 'next/server';
import {bulk108ContentHandle} from '@/lib/localBulk108Content';
export const runtime='nodejs';
export async function DELETE(req:NextRequest,ctx:{params:Promise<{id:string;imageId:string}>}){return bulk108ContentHandle(req,'newsletter-circulars','delete',(await ctx.params).id);}
