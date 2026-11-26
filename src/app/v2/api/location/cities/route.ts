import { bulk115AllLocations } from '@/lib/localBulk115Location';
export const runtime='nodejs';
export async function GET(){return bulk115AllLocations('cities');}
