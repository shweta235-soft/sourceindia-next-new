import type { NextRequest } from 'next/server';
import {bulk108ContentHandle} from '@/lib/localBulk108Content';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){return bulk108ContentHandle(req,'email-templates','detail',(await ctx.params).id);}
export async function PUT(req:NextRequest,ctx:{params:Promise<{id:string}>}){return bulk108ContentHandle(req,'email-templates','update',(await ctx.params).id);}
export async function DELETE(req:NextRequest,ctx:{params:Promise<{id:string}>}){return bulk108ContentHandle(req,'email-templates','delete',(await ctx.params).id);}
