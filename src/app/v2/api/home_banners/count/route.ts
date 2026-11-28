import {bannerCount} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
export async function GET(){return bannerCount();}
