import { bulk115ByState } from '@/lib/localBulk115Location';
export const runtime='nodejs';
export async function GET(req:Request,ctx:{params:Promise<{state_id:string}>}){const {state_id}=await ctx.params;return bulk115ByState(state_id);}
