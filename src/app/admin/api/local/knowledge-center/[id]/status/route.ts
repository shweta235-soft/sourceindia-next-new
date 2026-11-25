import type {NextRequest} from 'next/server';
import {PATCH_STATUS} from '../write';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){return PATCH_STATUS(req,ctx);}
