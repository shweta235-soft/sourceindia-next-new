import type {NextRequest} from 'next/server';
import {bulk104Handle} from '@/lib/localBulk104Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'applications','detail',(await params).id);}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'applications','update',(await params).id);}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'applications','delete',(await params).id);}
