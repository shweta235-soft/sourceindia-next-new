import type {NextRequest} from 'next/server';
import {bannerDeleteSelected} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
export async function DELETE(req:NextRequest){return bannerDeleteSelected(req);}
