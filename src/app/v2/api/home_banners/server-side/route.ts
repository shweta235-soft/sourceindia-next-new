import type {NextRequest} from 'next/server';
import {bannerServerSide} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bannerServerSide(req);}
