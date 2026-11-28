import type {NextRequest} from 'next/server';
import {getSite,updateSettings} from '@/lib/localBulk136Settings';
export const runtime='nodejs';
export async function GET(req:NextRequest){return getSite(req);}
export async function PUT(req:NextRequest){return updateSettings(req,'site_settings');}
