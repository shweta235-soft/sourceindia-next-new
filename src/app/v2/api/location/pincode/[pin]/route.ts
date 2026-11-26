import { bulk115Pincode } from '@/lib/localBulk115Location';
export const runtime='nodejs';
export async function GET(req:Request,ctx:{params:Promise<{pin:string}>}){const {pin}=await ctx.params;return bulk115Pincode(pin);}
