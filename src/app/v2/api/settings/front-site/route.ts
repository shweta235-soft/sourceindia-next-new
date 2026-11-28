import {getFrontSite} from '@/lib/localBulk136Settings';
export const runtime='nodejs';
export async function GET(){return getFrontSite();}
