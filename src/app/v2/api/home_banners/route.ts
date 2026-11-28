import type {NextRequest} from 'next/server';
import {listBanners,bannerPost} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
export async function GET(){return listBanners();}
export async function POST(req:NextRequest){return bannerPost(req);}
