import type { NextRequest } from 'next/server';
import {bulk108ContentHandle} from '@/lib/localBulk108Content';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk108ContentHandle(req,'newsletter-circulars','userTypes');}
