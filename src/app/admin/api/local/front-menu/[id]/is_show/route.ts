import type {NextRequest} from 'next/server';
import {PATCH_SHOW} from '../write';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){return PATCH_SHOW(req,ctx);}
