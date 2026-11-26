import { bulk115StatesForCountry } from '@/lib/localBulk115Location';
export const runtime='nodejs';
export async function GET(req:Request,ctx:{params:Promise<{country_id:string}>}){const {country_id}=await ctx.params;return bulk115StatesForCountry(req,country_id);}
