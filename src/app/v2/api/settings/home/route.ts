import type {NextRequest} from 'next/server';
import {getHome,updateSettings} from '@/lib/localBulk136Settings';
export const runtime='nodejs';
export async function GET(){return getHome();}
export async function PUT(req:NextRequest){return updateSettings(req,'home_settings');}
