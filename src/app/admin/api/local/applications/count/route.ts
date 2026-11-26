import type {NextRequest} from 'next/server';
import {bulk104Handle} from '@/lib/localBulk104Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk104Handle(req,'applications','count');}
